using System.Diagnostics;
using Cine.Data;
using Cine.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cine.Controllers;

public class HomeController : Controller
{
    private readonly CineDbContext _context;

    public HomeController(CineDbContext context)
    {
        _context = context;
    }

    public IActionResult Index(string? busqueda, string? genero, int? sucursalId)
    {
        var sucursales = _context.Sucursales.Where(s => s.Activa).OrderBy(s => s.Nombre).ToList();
        var seleccionada = sucursalId
            ?? HttpContext.Session.GetInt32("SucursalId")
            ?? sucursales.FirstOrDefault()?.Id;
        if (seleccionada.HasValue && sucursales.Any(s => s.Id == seleccionada.Value))
            HttpContext.Session.SetInt32("SucursalId", seleccionada.Value);

        var consulta = _context.Peliculas
            .Include(p => p.PeliculasSalas).ThenInclude(ps => ps.Sala)
            .Include(p => p.Horarios.Where(h => h.Fecha >= DateTime.Today && (!seleccionada.HasValue || h.Sala!.SucursalId == seleccionada.Value))).ThenInclude(h => h.Sala)
            .Where(p => p.Activa);
        if (seleccionada.HasValue)
            consulta = consulta.Where(p => p.Horarios.Any(h => h.Fecha >= DateTime.Today && h.Sala!.SucursalId == seleccionada.Value));
        if (!string.IsNullOrWhiteSpace(busqueda))
            consulta = consulta.Where(p => p.Titulo.Contains(busqueda) || p.Director.Contains(busqueda));
        if (!string.IsNullOrWhiteSpace(genero))
            consulta = consulta.Where(p => p.Genero == genero);
        ViewBag.Generos = _context.Peliculas.Where(p => p.Activa).Select(p => p.Genero).Distinct().OrderBy(g => g).ToList();
        ViewBag.Busqueda = busqueda;
        ViewBag.Genero = genero;
        ViewBag.Sucursales = sucursales;
        ViewBag.SucursalId = seleccionada;
        ViewBag.SucursalSeleccionada = sucursales.FirstOrDefault(s => s.Id == seleccionada);
        var peliculas = consulta.OrderBy(p => p.Titulo).ToList();
        return View(peliculas);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
