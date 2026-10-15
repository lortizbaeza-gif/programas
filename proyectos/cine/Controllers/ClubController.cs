using Cine.Data;
using Cine.Models;
using Microsoft.AspNetCore.Mvc;

namespace Cine.Controllers;

public class ClubController : Controller
{
    private readonly CineDbContext _context;
    public ClubController(CineDbContext context) => _context = context;

    public IActionResult Planes() => View();

    [HttpGet]
    public IActionResult Inscribirse(string plan = "Básico")
    {
        ViewBag.Plan = plan;
        return View(new MiembroClub { Nivel = plan, DescuentoPorcentaje = Descuento(plan) });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult Inscribirse(MiembroClub miembro)
    {
        if (string.IsNullOrWhiteSpace(miembro.Nombre) || string.IsNullOrWhiteSpace(miembro.Email))
        {
            ModelState.AddModelError(string.Empty, "Completa tu nombre y correo.");
            return View(miembro);
        }
        miembro.Nivel = NormalizarPlan(miembro.Nivel);
        miembro.DescuentoPorcentaje = Descuento(miembro.Nivel);
        miembro.Codigo = $"CINE{Random.Shared.Next(100000, 999999)}";
        miembro.Puntos = 100; // bono de bienvenida demostrable
        miembro.Activo = true;
        _context.MiembrosClub.Add(miembro);
        _context.SaveChanges();
        HttpContext.Session.SetInt32("MiembroClubId", miembro.Id);
        return RedirectToAction(nameof(MiClub));
    }

    public IActionResult MiClub()
    {
        var id = HttpContext.Session.GetInt32("MiembroClubId");
        var miembro = id.HasValue ? _context.MiembrosClub.Find(id.Value) : null;
        return miembro == null ? RedirectToAction(nameof(Planes)) : View(miembro);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CerrarSesionClub()
    {
        HttpContext.Session.Remove("MiembroClubId");
        return RedirectToAction(nameof(Planes));
    }

    private static string NormalizarPlan(string? plan) => plan switch { "Pro" => "Pro", "Plus" => "Plus", "Premium" => "Premium", _ => "Básico" };
    private static decimal Descuento(string? plan) => plan switch { "Pro" => 8m, "Plus" => 12m, "Premium" => 18m, _ => 5m };
}
