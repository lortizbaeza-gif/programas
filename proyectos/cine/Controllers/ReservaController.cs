using Cine.Data;
using Cine.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cine.Controllers;

public class ReservaController : Controller
{
    private readonly CineDbContext _context;

    public ReservaController(CineDbContext context)
    {
        _context = context;
    }

    public IActionResult SeleccionarHorario(int id)
    {
        var sucursalId = HttpContext.Session.GetInt32("SucursalId");
        var pelicula = _context.Peliculas
            .Include(p => p.Horarios.Where(h => h.Fecha >= DateTime.Today && (!sucursalId.HasValue || h.Sala!.SucursalId == sucursalId.Value)))
            .ThenInclude(h => h.Sala)
            .FirstOrDefault(p => p.Id == id);

        if (pelicula == null)
        {
            return NotFound();
        }

        return View(pelicula);
    }

    [HttpPost]
    public IActionResult SeleccionarBoletos(int horarioId, int adultos, int alumnos, int ninos)
    {
        if (adultos < 0 || alumnos < 0 || ninos < 0 || adultos + alumnos + ninos < 1)
        {
            TempData["ErrorBoletos"] = "Selecciona al menos un boleto.";
            var peliculaId = _context.Horarios.Where(h => h.Id == horarioId).Select(h => h.PeliculaId).FirstOrDefault();
            return RedirectToAction(nameof(SeleccionarHorario), new { id = peliculaId });
        }
        var reserva = new ReservaSessionData
        {
            HorarioId = horarioId,
            Adultos = adultos,
            Alumnos = alumnos,
            Ninos = ninos
        };

        HttpContext.Session.SetInt32("ReservaHorarioId", horarioId);
        HttpContext.Session.SetInt32("ReservaAdultos", adultos);
        HttpContext.Session.SetInt32("ReservaAlumnos", alumnos);
        HttpContext.Session.SetInt32("ReservaNinos", ninos);

        return RedirectToAction(nameof(SeleccionarAsientos));
    }

    public IActionResult SeleccionarAsientos()
    {
        var horarioId = HttpContext.Session.GetInt32("ReservaHorarioId") ?? 0;
        var horario = _context.Horarios
            .Include(h => h.Pelicula)
            .Include(h => h.Sala)
            .FirstOrDefault(h => h.Id == horarioId);

        if (horario == null)
        {
            return RedirectToAction("Index", "Home");
        }

        var asientos = _context.Asientos
            .Where(a => a.SalaId == horario.SalaId)
            .OrderBy(a => a.Fila)
            .ThenBy(a => a.Numero)
            .ToList();

        if (!asientos.Any())
        {
            var sala = horario.Sala;
            var filas = Enumerable.Range(0, sala?.Filas ?? 8).Select(i => (char)('A' + i)).ToArray();
            var columnas = sala?.Columnas ?? 10;

            for (int i = 0; i < filas.Length; i++)
            {
                for (int j = 1; j <= columnas; j++)
                {
                    asientos.Add(new Asiento
                    {
                        Fila = filas[i].ToString(),
                        Numero = j,
                        SalaId = horario.SalaId,
                        Ocupado = false
                    });
                }
            }

            _context.Asientos.AddRange(asientos);
            _context.SaveChanges();
        }

        // Un asiento puede venderse en varias funciones de una sala, pero solo una vez por horario.
        var ocupadosEnFuncion = _context.ReservasAsientos
            .Where(r => r.HorarioId == horarioId)
            .Select(r => r.AsientoId)
            .ToHashSet();
        foreach (var asiento in asientos)
            asiento.Ocupado = ocupadosEnFuncion.Contains(asiento.Id);

        ViewBag.Horario = horario;
        return View(asientos);
    }

    [HttpPost]
    public IActionResult ConfirmarAsientos(List<int> asientosSeleccionados)
    {
        var adultos = HttpContext.Session.GetInt32("ReservaAdultos") ?? 0;
        var alumnos = HttpContext.Session.GetInt32("ReservaAlumnos") ?? 0;
        var ninos = HttpContext.Session.GetInt32("ReservaNinos") ?? 0;
        var boletos = adultos + alumnos + ninos;

        if (asientosSeleccionados == null || asientosSeleccionados.Count != boletos)
        {
            TempData["ErrorAsientos"] = $"Debes seleccionar exactamente {boletos} asientos para tus boletos.";
            return RedirectToAction(nameof(SeleccionarAsientos));
        }

        var horarioId = HttpContext.Session.GetInt32("ReservaHorarioId") ?? 0;
        var yaOcupados = _context.ReservasAsientos
            .Where(r => r.HorarioId == horarioId && asientosSeleccionados.Contains(r.AsientoId))
            .Any();
        if (yaOcupados)
        {
            TempData["ErrorAsientos"] = "Uno o más asientos ya fueron vendidos. Selecciona otros lugares.";
            return RedirectToAction(nameof(SeleccionarAsientos));
        }

        HttpContext.Session.SetString("ReservaAsientos", string.Join(',', asientosSeleccionados));

        return RedirectToAction("Resumen", "Checkout");
    }
}
