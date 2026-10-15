using Cine.Data;
using Cine.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Cine.Controllers;

public class DulceriaController : Controller
{
    private readonly CineDbContext _context;

    public DulceriaController(CineDbContext context)
    {
        _context = context;
    }

    public IActionResult Index()
    {
        var productos = _context.ProductosAlimentos.OrderBy(p => p.Categoria).ThenBy(p => p.Nombre).ToList();
        var itemsCarrito = ObtenerCarrito();
        var cantidades = itemsCarrito.GroupBy(i => i.ProductoId).ToDictionary(g => g.Key, g => g.Count());
        ViewBag.CarritoCantidad = itemsCarrito.Count;
        ViewBag.CarritoTotal = productos.Sum(p => p.Precio * (cantidades.TryGetValue(p.Id, out var cantidad) ? cantidad : 0));
        var miembroId = HttpContext.Session.GetInt32("MiembroClubId");
        ViewBag.MiembroClub = miembroId.HasValue ? _context.MiembrosClub.Find(miembroId.Value) : null;
        return View(productos);
    }

    public IActionResult Personalizar(int id)
    {
        var producto = _context.ProductosAlimentos.FirstOrDefault(p => p.Id == id);
        if (producto == null)
        {
            return NotFound();
        }

        ViewBag.Producto = producto;
        return View(producto);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult AgregarAlCarrito(int id, string tamano = "Mediano", string sabor = "Original",
        List<string>? bebidas = null, string tamanoNachos = "", bool extraQueso = false,
        bool agregarSalsa = false, bool agregarHielo = false)
    {
        var producto = _context.ProductosAlimentos.Find(id);
        if (producto == null || producto.Existencia <= 0)
        {
            TempData["ErrorCarrito"] = "Este producto está agotado temporalmente.";
            return RedirectToAction(nameof(Index));
        }
        var items = ObtenerCarrito();
        if (items.Count(i => i.ProductoId == id) >= producto.Existencia)
        {
            TempData["ErrorCarrito"] = "No hay más unidades disponibles de este producto.";
            return RedirectToAction(nameof(Carrito));
        }
        var saboresBebida = new[] { "Fanta", "Té", "Coca-Cola", "Mundet", "Agua" };
        var cantidadBebidas = Math.Clamp(producto.CantidadBebidas, 0, 6);
        if (producto.Categoria == "Bebida" && cantidadBebidas == 0) cantidadBebidas = 1;
        var bebidasValidas = (bebidas ?? new List<string>())
            .Where(saboresBebida.Contains)
            .Take(cantidadBebidas)
            .ToList();
        while (bebidasValidas.Count < cantidadBebidas) bebidasValidas.Add("Coca-Cola");

        var tamanosFijos = new Dictionary<string, string>
        {
            ["Chicas"] = "Pequeño",
            ["Medianas"] = "Mediano",
            ["Grandes"] = "Grande"
        };
        if (tamanosFijos.TryGetValue(producto.TamanoPalomitas, out var tamanoFijo))
            tamano = tamanoFijo;
        var incluyeNachos = producto.TamanoNachos != "No aplica";
        if (!incluyeNachos)
        {
            tamanoNachos = string.Empty;
            extraQueso = false;
        }
        else if (producto.TamanoNachos == "Cualquier tamaño")
        {
            var tamanosNachosValidos = new[] { "Chicos", "Medianos", "Grandes" };
            if (!tamanosNachosValidos.Contains(tamanoNachos))
                tamanoNachos = "Medianos";
        }
        else
        {
            tamanoNachos = producto.TamanoNachos;
        }
        extraQueso = incluyeNachos && producto.PermiteExtraQueso && extraQueso;
        items.Add(new ItemCarritoDulceria
        {
            ProductoId = id,
            Tamano = string.IsNullOrWhiteSpace(tamano) ? "Mediano" : tamano,
            Sabor = string.IsNullOrWhiteSpace(sabor) ? "Original" : sabor,
            Bebidas = bebidasValidas,
            TamanoNachos = tamanoNachos,
            ExtraQueso = extraQueso,
            AgregarSalsa = agregarSalsa,
            AgregarHielo = agregarHielo
        });
        GuardarCarrito(items);

        return RedirectToAction(nameof(Carrito));
    }

    public IActionResult Carrito()
    {
        var items = ObtenerCarrito();
        var ids = items.Select(i => i.ProductoId).Distinct().ToList();

        var productos = _context.ProductosAlimentos
            .Where(p => ids.Contains(p.Id))
            .ToList();

        foreach (var item in items)
            item.Producto = productos.FirstOrDefault(p => p.Id == item.ProductoId);

        return View(items.Where(i => i.Producto != null).ToList());
    }

    [HttpPost]
    public IActionResult EliminarDelCarrito(int index)
    {
        var items = ObtenerCarrito();
        if (index >= 0 && index < items.Count)
        {
            items.RemoveAt(index);
        }
        GuardarCarrito(items);

        return RedirectToAction(nameof(Carrito));
    }

    public IActionResult LimpiarCarrito()
    {
        HttpContext.Session.Remove("CarritoProductos");
        HttpContext.Session.Remove("CarritoDulceria");
        return RedirectToAction(nameof(Index));
    }

    private List<ItemCarritoDulceria> ObtenerCarrito()
    {
        var json = HttpContext.Session.GetString("CarritoDulceria");
        if (!string.IsNullOrWhiteSpace(json))
            return JsonSerializer.Deserialize<List<ItemCarritoDulceria>>(json) ?? new();

        // Conserva productos agregados antes de esta actualización.
        var anterior = HttpContext.Session.GetString("CarritoProductos") ?? string.Empty;
        return string.IsNullOrWhiteSpace(anterior)
            ? new()
            : anterior.Split(',').Where(x => int.TryParse(x, out _))
                .Select(x => new ItemCarritoDulceria { ProductoId = int.Parse(x) }).ToList();
    }

    private void GuardarCarrito(List<ItemCarritoDulceria> items)
    {
        HttpContext.Session.SetString("CarritoDulceria", JsonSerializer.Serialize(items));
        HttpContext.Session.SetString("CarritoProductos", string.Join(',', items.Select(i => i.ProductoId)));
    }
}
