using Cine.Data;
using Cine.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Cine.Controllers;

public class CheckoutController : Controller
{
    private readonly CineDbContext _context;

    public CheckoutController(CineDbContext context)
    {
        _context = context;
    }

    public IActionResult Resumen()
    {
        return View(CrearOrdenDesdeSesion(null));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Pagar(string? codigoBeneficio)
    {
        var orden = CrearOrdenDesdeSesion(codigoBeneficio);
        if (orden.Detalles.Count == 0)
            return RedirectToAction("Index", "Home");

        _context.Ordenes.Add(orden);
        _context.SaveChanges();

        var horarioId = HttpContext.Session.GetInt32("ReservaHorarioId") ?? 0;
        var textoAsientos = HttpContext.Session.GetString("ReservaAsientos") ?? string.Empty;
        var asientoIds = string.IsNullOrWhiteSpace(textoAsientos) ? new List<int>() : textoAsientos.Split(',').Select(int.Parse).ToList();
        if (horarioId > 0)
        {
            var conflictos = _context.ReservasAsientos.Any(r => r.HorarioId == horarioId && asientoIds.Contains(r.AsientoId));
            if (conflictos)
            {
                TempData["ErrorAsientos"] = "Los asientos fueron vendidos mientras se procesaba el pago.";
                return RedirectToAction("SeleccionarAsientos", "Reserva");
            }
            _context.ReservasAsientos.AddRange(asientoIds.Select(id => new ReservaAsiento { HorarioId = horarioId, AsientoId = id, OrdenId = orden.Id }));
        }

        // La venta de dulcería descuenta existencias y queda registrada en el inventario.
        var itemsCarrito = ObtenerCarritoDulceria();
        foreach (var grupo in itemsCarrito.GroupBy(i => i.ProductoId))
        {
            var producto = _context.ProductosAlimentos.Find(grupo.Key);
            if (producto != null)
            {
                var cantidad = Math.Min(producto.Existencia, grupo.Count());
                producto.Existencia -= cantidad;
                _context.MovimientosInventario.Add(new MovimientoInventario { ProductoId = producto.Id, Tipo = "Salida", Cantidad = cantidad, Motivo = $"Venta orden #{orden.Id}" });
            }
        }
        if (orden.MiembroClubId.HasValue)
        {
            var miembro = _context.MiembrosClub.Find(orden.MiembroClubId.Value);
            if (miembro != null) miembro.Puntos += (int)(orden.Total / 10);
        }
        _context.SaveChanges();

        HttpContext.Session.Remove("ReservaAdultos");
        HttpContext.Session.Remove("ReservaAlumnos");
        HttpContext.Session.Remove("ReservaNinos");
        HttpContext.Session.Remove("ReservaAsientos");
        HttpContext.Session.Remove("ReservaHorarioId");
        HttpContext.Session.Remove("CarritoProductos");
        HttpContext.Session.Remove("CarritoDulceria");
        return RedirectToAction(nameof(Ticket), new { id = orden.Id });
    }

    private Orden CrearOrdenDesdeSesion(string? codigoBeneficio)
    {
        if (string.IsNullOrWhiteSpace(codigoBeneficio))
        {
            var miembroId = HttpContext.Session.GetInt32("MiembroClubId");
            var miembroSesion = miembroId.HasValue ? _context.MiembrosClub.Find(miembroId.Value) : null;
            codigoBeneficio = miembroSesion?.Activo == true ? miembroSesion.Codigo : null;
        }
        var adultos = HttpContext.Session.GetInt32("ReservaAdultos") ?? 0;
        var alumnos = HttpContext.Session.GetInt32("ReservaAlumnos") ?? 0;
        var ninos = HttpContext.Session.GetInt32("ReservaNinos") ?? 0;
        var asientos = HttpContext.Session.GetString("ReservaAsientos") ?? string.Empty;
        var asientosSeleccionados = string.IsNullOrWhiteSpace(asientos) ? 0 : asientos.Split(',').Length;

        var itemsCarrito = ObtenerCarritoDulceria();
        var idsProductos = itemsCarrito.Select(i => i.ProductoId).Distinct().ToList();
        var productos = _context.ProductosAlimentos.Where(p => idsProductos.Contains(p.Id)).ToList();

        var horarioId = HttpContext.Session.GetInt32("ReservaHorarioId") ?? 0;
        var horario = _context.Horarios.Include(h => h.Sala).FirstOrDefault(h => h.Id == horarioId);
        var sala = horario?.Sala;
        var precioAdulto = horario?.FormatoFuncion switch { "3D" => sala?.PrecioAdulto3D ?? 190m, "4D" => sala?.PrecioAdulto4D ?? 260m, _ => sala?.PrecioAdulto ?? 150m };
        var precioAlumno = horario?.FormatoFuncion switch { "3D" => sala?.PrecioAlumno3D ?? 155m, "4D" => sala?.PrecioAlumno4D ?? 220m, _ => sala?.PrecioAlumno ?? 120m };
        var precioNino = horario?.FormatoFuncion switch { "3D" => sala?.PrecioNino3D ?? 120m, "4D" => sala?.PrecioNino4D ?? 180m, _ => sala?.PrecioNino ?? 90m };
        var subtotalDulceria = itemsCarrito.Sum(i => productos.FirstOrDefault(p => p.Id == i.ProductoId)?.Precio ?? 0);
        var subtotal = (adultos * precioAdulto) + (alumnos * precioAlumno) + (ninos * precioNino) + subtotalDulceria;
        var orden = new Orden
        {
            Fecha = DateTime.Now,
            Total = subtotal,
            MetodoPago = "Tarjeta"
        };

        if (adultos > 0) orden.Detalles.Add(new DetalleOrden { Concepto = "Boleto adulto", Cantidad = adultos, PrecioUnitario = precioAdulto });
        if (alumnos > 0) orden.Detalles.Add(new DetalleOrden { Concepto = "Boleto alumno", Cantidad = alumnos, PrecioUnitario = precioAlumno });
        if (ninos > 0) orden.Detalles.Add(new DetalleOrden { Concepto = "Boleto niño", Cantidad = ninos, PrecioUnitario = precioNino });
        foreach (var item in itemsCarrito)
        {
            var producto = productos.FirstOrDefault(p => p.Id == item.ProductoId);
            if (producto == null) continue;
            var personalizacion = item.DescripcionPersonalizacion();
            var concepto = string.IsNullOrWhiteSpace(personalizacion)
                ? producto.Nombre
                : $"{producto.Nombre} ({personalizacion})";
            orden.Detalles.Add(new DetalleOrden { Concepto = concepto, Cantidad = 1, PrecioUnitario = producto.Precio });
        }
        if (!string.IsNullOrWhiteSpace(codigoBeneficio))
        {
            var codigo = codigoBeneficio.Trim().ToUpperInvariant();
            var miembro = _context.MiembrosClub.FirstOrDefault(m => m.Activo && m.Codigo.ToUpper() == codigo);
            var promo = miembro == null ? _context.Promociones.FirstOrDefault(p => p.Activa && p.Inicio <= DateTime.Today && p.Fin >= DateTime.Today && p.Codigo.ToUpper() == codigo) : null;
            var porcentaje = miembro?.DescuentoPorcentaje ?? promo?.DescuentoPorcentaje ?? 0;
            if (porcentaje > 0)
            {
                orden.Descuento = Math.Round(subtotal * porcentaje / 100m, 2);
                orden.Total = subtotal - orden.Descuento;
                orden.CodigoBeneficio = codigo;
                orden.MiembroClubId = miembro?.Id;
            }
        }
        ViewBag.AsientosSeleccionados = asientosSeleccionados;
        return orden;
    }

    private List<ItemCarritoDulceria> ObtenerCarritoDulceria()
    {
        var json = HttpContext.Session.GetString("CarritoDulceria");
        if (!string.IsNullOrWhiteSpace(json))
            return JsonSerializer.Deserialize<List<ItemCarritoDulceria>>(json) ?? new();

        var anterior = HttpContext.Session.GetString("CarritoProductos") ?? string.Empty;
        return string.IsNullOrWhiteSpace(anterior)
            ? new()
            : anterior.Split(',').Where(x => int.TryParse(x, out _))
                .Select(x => new ItemCarritoDulceria { ProductoId = int.Parse(x) }).ToList();
    }

    public IActionResult Ticket(int id)
    {
        var orden = _context.Ordenes
            .Include(o => o.Detalles)
            .FirstOrDefault(o => o.Id == id);

        if (orden == null)
        {
            return NotFound();
        }

        return View(orden);
    }
}
