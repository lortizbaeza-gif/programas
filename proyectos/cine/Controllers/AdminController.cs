using Cine.Data;
using Cine.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cine.Controllers;

public class AdminController : Controller
{
    private readonly CineDbContext _context;

    public AdminController(CineDbContext context)
    {
        _context = context;
    }

    public IActionResult Index()
    {
        ViewBag.TotalPeliculas = _context.Peliculas.Count();
        ViewBag.TotalHorarios = _context.Horarios.Count(h => h.Fecha >= DateTime.Today);
        ViewBag.TotalProductos = _context.ProductosAlimentos.Count();
        ViewBag.TotalSalas = _context.Salas.Count();
        // SQLite no admite SUM sobre decimal; se agregan los importes en memoria.
        ViewBag.VentasHoy = _context.Ordenes
            .Where(o => o.Fecha.Date == DateTime.Today)
            .Select(o => o.Total)
            .AsEnumerable()
            .Sum();
        ViewBag.OrdenesHoy = _context.Ordenes.Count(o => o.Fecha.Date == DateTime.Today);
        return View();
    }

    // Películas
    public IActionResult Peliculas(int? sucursalId)
    {
        var consulta = _context.Peliculas.Include(p => p.PeliculasSalas).ThenInclude(ps => ps.Sala).AsQueryable();
        if (sucursalId.HasValue)
            consulta = consulta.Where(p => p.PeliculasSalas.Any(ps => ps.Sala!.SucursalId == sucursalId.Value));
        ViewBag.SucursalId = sucursalId;
        ViewBag.Sucursal = sucursalId.HasValue ? _context.Sucursales.Find(sucursalId.Value) : null;
        var peliculas = consulta.OrderBy(p => p.Titulo).ToList();
        return View(peliculas);
    }

    public IActionResult CrearPelicula(int? sucursalId)
    {
        sucursalId ??= _context.Sucursales.Where(s => s.Activa).OrderBy(s => s.Nombre).Select(s => (int?)s.Id).FirstOrDefault();
        CargarSalasPelicula(sucursalId: sucursalId);
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult CrearPelicula(Pelicula pelicula, List<FuncionPeliculaInput> funciones, IFormFile? posterArchivo, int? sucursalId)
    {
        ValidarCatalogosPelicula(pelicula);
        var disponibles = funciones.Where(f => f.Disponible).ToList();
        if (disponibles.Count == 0)
            ModelState.AddModelError(nameof(funciones), "Marca al menos una sala como disponible.");
        foreach (var funcion in disponibles)
        {
            var sala = _context.Salas.Find(funcion.SalaId);
            if (sala == null) ModelState.AddModelError(nameof(funciones), "Una de las salas seleccionadas no existe.");
            else
            {
                if (funcion.Fecha.Date < DateTime.Today) ModelState.AddModelError(nameof(funciones), $"La fecha de Sala {sala.Letra} no puede estar en el pasado.");
                if (funcion.Formato == "3D" && !sala.Soporta3D)
                    ModelState.AddModelError(nameof(funciones), $"La Sala {sala.Letra} no está configurada para funciones 3D.");
                if (funcion.Formato == "4D" && !sala.Soporta4D)
                    ModelState.AddModelError(nameof(funciones), $"La Sala {sala.Letra} no está configurada para funciones 4D.");
                var conflicto = BuscarFuncionEnConflicto(funcion.SalaId, funcion.Fecha, funcion.Hora, pelicula.Duracion);
                if (conflicto != null)
                {
                    var finOcupacion = conflicto.Fecha.Date.Add(conflicto.Hora)
                        .AddMinutes(conflicto.Pelicula?.Duracion ?? 0);
                    ModelState.AddModelError(nameof(funciones),
                        $"La Sala {sala.Letra} está ocupada por \"{conflicto.Pelicula?.Titulo}\" hasta las {finOcupacion:HH:mm}. Programa la nueva función a partir de esa hora.");
                }
            }
        }
        if (!GuardarPoster(posterArchivo, pelicula, out var error))
            ModelState.AddModelError("posterArchivo", error);
        pelicula.PosterUrl ??= "/images/poster-placeholder.svg";
        if (ModelState.IsValid)
        {
            _context.Peliculas.Add(pelicula);
            _context.SaveChanges();
            _context.PeliculasSalas.AddRange(disponibles.Select(f => f.SalaId).Distinct().Select(salaId => new PeliculaSala { PeliculaId = pelicula.Id, SalaId = salaId }));
            _context.Horarios.AddRange(disponibles.Select(f => new Horario
            {
                PeliculaId = pelicula.Id,
                SalaId = f.SalaId,
                Fecha = f.Fecha.Date,
                Hora = f.Hora,
                FormatoFuncion = f.Formato
            }));
            foreach (var funcion in disponibles)
            {
                var sala = _context.Salas.Find(funcion.SalaId);
                if (sala != null && funcion.Formato == "3D") sala.Soporta3D = true;
                if (sala != null && funcion.Formato == "4D") sala.Soporta4D = true;
            }
            _context.SaveChanges();
            return RedirectToAction(nameof(Peliculas));
        }

        CargarSalasPelicula(funciones: funciones, sucursalId: sucursalId);
        return View(pelicula);
    }

    public IActionResult EditarPelicula(int id)
    {
        var pelicula = _context.Peliculas.Include(p => p.PeliculasSalas).FirstOrDefault(p => p.Id == id);
        if (pelicula == null) return NotFound();
        CargarSalasPelicula(pelicula.PeliculasSalas.Select(ps => ps.SalaId));
        return View(pelicula);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult EditarPelicula(int id, Pelicula pelicula, List<int> salasSeleccionadas, IFormFile? posterArchivo)
    {
        if (id != pelicula.Id) return BadRequest();
        ValidarCatalogosPelicula(pelicula);

        var posterActual = _context.Peliculas.AsNoTracking().Where(p => p.Id == id).Select(p => p.PosterUrl).FirstOrDefault();
        pelicula.PosterUrl = string.IsNullOrWhiteSpace(posterActual) ? "/images/poster-placeholder.svg" : posterActual;
        if (salasSeleccionadas.Count == 0)
            ModelState.AddModelError(nameof(salasSeleccionadas), "Selecciona al menos una sala.");
        if (!GuardarPoster(posterArchivo, pelicula, out var error))
            ModelState.AddModelError("posterArchivo", error);

        if (ModelState.IsValid)
        {
            _context.Update(pelicula);
            _context.PeliculasSalas.RemoveRange(_context.PeliculasSalas.Where(ps => ps.PeliculaId == id));
            _context.PeliculasSalas.AddRange(salasSeleccionadas.Distinct().Select(salaId => new PeliculaSala { PeliculaId = id, SalaId = salaId }));
            _context.SaveChanges();
            return RedirectToAction(nameof(Peliculas));
        }

        CargarSalasPelicula(salasSeleccionadas);
        return View(pelicula);
    }

    private void CargarSalasPelicula(IEnumerable<int>? seleccionadas = null, List<FuncionPeliculaInput>? funciones = null, int? sucursalId = null)
    {
        var consulta = _context.Salas.Include(s => s.Sucursal).AsQueryable();
        if (sucursalId.HasValue) consulta = consulta.Where(s => s.SucursalId == sucursalId.Value);
        var salas = consulta.OrderBy(s => s.Sucursal!.Nombre).ThenBy(s => s.Letra).ThenBy(s => s.Nombre).ToList();
        ViewBag.Salas = salas;
        ViewBag.Sucursales = _context.Sucursales.Where(s => s.Activa).OrderBy(s => s.Nombre).ToList();
        ViewBag.SucursalId = sucursalId;
        ViewBag.Ocupaciones = _context.Horarios
            .Include(h => h.Pelicula)
            .Where(h => salas.Select(s => s.Id).Contains(h.SalaId) && h.Fecha >= DateTime.Today)
            .OrderBy(h => h.Fecha).ThenBy(h => h.Hora)
            .ToList()
            .GroupBy(h => h.SalaId)
            .ToDictionary(g => g.Key, g => g.Take(8).ToList());
        ViewBag.SalasSeleccionadas = (seleccionadas ?? Enumerable.Empty<int>()).ToHashSet();
        ViewBag.Funciones = funciones ?? salas.Select(s => new FuncionPeliculaInput { SalaId = s.Id }).ToList();
    }

    private void ValidarCatalogosPelicula(Pelicula pelicula)
    {
        var generos = new[] { "Comedia", "Drama", "Ciencia ficción", "Fantasía", "Terror", "Biografía" };
        var clasificaciones = new[] { "AA", "A", "B", "B15", "C", "D" };
        if (!generos.Contains(pelicula.Genero))
            ModelState.AddModelError(nameof(pelicula.Genero), "Selecciona un género válido.");
        if (!clasificaciones.Contains(pelicula.Clasificacion))
            ModelState.AddModelError(nameof(pelicula.Clasificacion), "Selecciona una clasificación válida.");
    }

    private static bool GuardarPoster(IFormFile? posterArchivo, Pelicula pelicula, out string error)
    {
        error = string.Empty;
        if (posterArchivo == null || posterArchivo.Length == 0) return true;
        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var extension = Path.GetExtension(posterArchivo.FileName).ToLowerInvariant();
        if (!extensionesPermitidas.Contains(extension)) { error = "Selecciona una imagen JPG, PNG, WEBP o GIF."; return false; }
        if (posterArchivo.Length > 5 * 1024 * 1024) { error = "La imagen no puede superar 5 MB."; return false; }
        var carpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "posters");
        Directory.CreateDirectory(carpeta);
        var nombre = $"{Guid.NewGuid():N}{extension}";
        using var archivo = System.IO.File.Create(Path.Combine(carpeta, nombre));
        posterArchivo.CopyTo(archivo);
        pelicula.PosterUrl = $"/uploads/posters/{nombre}";
        return true;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult EliminarPelicula(int id)
    {
        var pelicula = _context.Peliculas.Find(id);
        if (pelicula != null)
        {
            _context.Peliculas.Remove(pelicula);
            _context.SaveChanges();
        }

        return RedirectToAction(nameof(Peliculas));
    }

    // Horarios
    public IActionResult Horarios()
    {
        var horarios = _context.Horarios
            .Include(h => h.Pelicula)
            .Include(h => h.Sala)
            .ToList()
            .OrderBy(h => h.Fecha)
            .ThenBy(h => h.Hora)
            .ToList();
        return View(horarios);
    }

    public IActionResult CrearHorario()
    {
        ViewBag.Peliculas = _context.Peliculas.ToList();
        ViewBag.Salas = _context.Salas.ToList();
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult CrearHorario(Horario horario)
    {
        if (horario.Fecha.Date < DateTime.Today)
            ModelState.AddModelError(nameof(horario.Fecha), "No puedes programar funciones en una fecha pasada.");
        var pelicula = _context.Peliculas.Find(horario.PeliculaId);
        if (pelicula == null || !pelicula.Activa)
            ModelState.AddModelError(nameof(horario.PeliculaId), "Selecciona una película activa.");
        if (!_context.PeliculasSalas.Any(ps => ps.PeliculaId == horario.PeliculaId && ps.SalaId == horario.SalaId))
            ModelState.AddModelError(nameof(horario.SalaId), "Esa película no está asignada a la sala seleccionada.");
        var salaSeleccionada = _context.Salas.Find(horario.SalaId);
        if (horario.FormatoFuncion == "3D" && salaSeleccionada?.Soporta3D != true)
            ModelState.AddModelError(nameof(horario.FormatoFuncion), "La sala seleccionada no admite funciones 3D.");
        if (horario.FormatoFuncion == "4D" && salaSeleccionada?.Soporta4D != true)
            ModelState.AddModelError(nameof(horario.FormatoFuncion), "La sala seleccionada no admite funciones 4D.");
        if (ModelState.IsValid)
        {
            var conflicto = BuscarFuncionEnConflicto(horario.SalaId, horario.Fecha, horario.Hora, pelicula!.Duracion);
            if (conflicto != null)
            {
                var finOcupacion = conflicto.Fecha.Date.Add(conflicto.Hora)
                    .AddMinutes(conflicto.Pelicula?.Duracion ?? 0);
                ModelState.AddModelError(string.Empty,
                    $"La sala está ocupada por \"{conflicto.Pelicula?.Titulo}\" hasta las {finOcupacion:HH:mm}. La siguiente función puede comenzar a partir de esa hora.");
            }
        }
        if (ModelState.IsValid)
        {
            _context.Horarios.Add(horario);
            _context.SaveChanges();
            return RedirectToAction(nameof(Horarios));
        }

        ViewBag.Peliculas = _context.Peliculas.ToList();
        ViewBag.Salas = _context.Salas.ToList();
        return View(horario);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult EliminarHorario(int id)
    {
        var horario = _context.Horarios.Find(id);
        if (horario != null) { _context.Horarios.Remove(horario); _context.SaveChanges(); }
        return RedirectToAction(nameof(Horarios));
    }

    public IActionResult Salas(int? sucursalId)
    {
        var consulta = _context.Salas.Include(s => s.Sucursal).AsQueryable();
        if (sucursalId.HasValue) consulta = consulta.Where(s => s.SucursalId == sucursalId.Value);
        ViewBag.SucursalId = sucursalId;
        ViewBag.Sucursal = sucursalId.HasValue ? _context.Sucursales.Find(sucursalId.Value) : null;
        return View(consulta.OrderBy(s => s.Sucursal!.Nombre).ThenBy(s => s.Nombre).ToList());
    }
    public IActionResult CrearSala(int? sucursalId)
    {
        CargarSucursales(sucursalId);
        return View(new Sala { SucursalId = sucursalId ?? 0 });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearSala(Sala sala)
    {
        if (_context.Salas.Any(s => s.SucursalId == sala.SucursalId && s.Nombre == sala.Nombre)) ModelState.AddModelError(nameof(sala.Nombre), "Ya existe una sala con ese nombre en esta sucursal.");
        if (_context.Salas.Any(s => s.SucursalId == sala.SucursalId && s.Letra == sala.Letra)) ModelState.AddModelError(nameof(sala.Letra), "Ya existe una sala con esa letra en esta sucursal.");
        if (!_context.Sucursales.Any(s => s.Id == sala.SucursalId && s.Activa)) ModelState.AddModelError(nameof(sala.SucursalId), "Selecciona una sucursal activa.");
        ValidarTipoSala(sala);
        if (sala.Filas is < 1 or > 26 || sala.Columnas is < 1 or > 30) ModelState.AddModelError(string.Empty, "La distribución debe tener entre 1-26 filas y 1-30 asientos por fila.");
        if (sala.PasilloDespuesColumna < 0 || sala.PasilloDespuesColumna >= sala.Columnas)
            ModelState.AddModelError(nameof(sala.PasilloDespuesColumna), "El pasillo debe estar dentro del número de columnas, o ser 0.");
        if (!ModelState.IsValid) { CargarSucursales(sala.SucursalId); return View(sala); }
        _context.Salas.Add(sala);
        _context.SaveChanges();
        SincronizarAsientos(sala);
        return RedirectToAction(nameof(Salas));
    }

    public IActionResult EditarSala(int id) { var sala = _context.Salas.Find(id); if (sala == null) return NotFound(); CargarSucursales(sala.SucursalId); return View(sala); }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult EditarSala(int id, Sala sala)
    {
        if (id != sala.Id) return BadRequest();
        if (_context.Salas.Any(s => s.Id != id && s.SucursalId == sala.SucursalId && s.Letra == sala.Letra)) ModelState.AddModelError(nameof(sala.Letra), "Ya existe una sala con esa letra en esta sucursal.");
        ValidarTipoSala(sala);
        if (sala.Filas is < 1 or > 26 || sala.Columnas is < 1 or > 30) ModelState.AddModelError(string.Empty, "La distribución debe tener entre 1-26 filas y 1-30 asientos por fila.");
        if (sala.PasilloDespuesColumna < 0 || sala.PasilloDespuesColumna >= sala.Columnas)
            ModelState.AddModelError(nameof(sala.PasilloDespuesColumna), "El pasillo debe estar dentro del número de columnas, o ser 0.");
        var fuera = _context.Asientos.Where(a => a.SalaId == id).AsEnumerable()
            .Where(a => (a.Fila[0] - 'A') >= sala.Filas || a.Numero > sala.Columnas)
            .Select(a => a.Id).ToList();
        if (fuera.Any() && _context.ReservasAsientos.Any(r => fuera.Contains(r.AsientoId)))
            ModelState.AddModelError(string.Empty, "No puedes reducir la sala porque hay boletos vendidos en asientos que desaparecerían.");
        if (!ModelState.IsValid) { CargarSucursales(sala.SucursalId); return View(sala); }
        _context.Update(sala);
        _context.SaveChanges();
        SincronizarAsientos(sala);
        return RedirectToAction(nameof(Salas));
    }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult EliminarSala(int id)
    {
        var sala = _context.Salas.Include(s => s.Horarios).FirstOrDefault(s => s.Id == id);
        if (sala == null) return RedirectToAction(nameof(Salas));
        if (sala.Horarios.Any()) { TempData["Error"] = "No puedes eliminar una sala con funciones programadas."; return RedirectToAction(nameof(Salas)); }
        _context.Salas.Remove(sala); _context.SaveChanges(); return RedirectToAction(nameof(Salas));
    }

    public IActionResult PreciosBoletos() => View(_context.Salas.OrderBy(s => s.Letra).ToList());

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ActualizarPreciosSala(int id,
        decimal precioAdulto, decimal precioAlumno, decimal precioNino,
        decimal precioAdulto3D, decimal precioAlumno3D, decimal precioNino3D,
        decimal precioAdulto4D, decimal precioAlumno4D, decimal precioNino4D)
    {
        var sala = _context.Salas.Find(id);
        if (sala == null) return NotFound();
        if (new[] { precioAdulto, precioAlumno, precioNino, precioAdulto3D, precioAlumno3D, precioNino3D, precioAdulto4D, precioAlumno4D, precioNino4D }.Any(p => p < 0))
        {
            TempData["Error"] = "Los precios no pueden ser negativos.";
            return RedirectToAction(nameof(PreciosBoletos));
        }
        var maximo2D = sala.Tipo == "VIP" ? 180m : 90m;
        var maximoPremium = sala.Tipo == "VIP" ? 180m : 150m;
        if (new[] { precioAdulto, precioAlumno, precioNino }.Any(p => p > maximo2D)
            || new[] { precioAdulto3D, precioAlumno3D, precioNino3D, precioAdulto4D, precioAlumno4D, precioNino4D }.Any(p => p > maximoPremium))
        {
            TempData["Error"] = sala.Tipo == "VIP"
                ? "En una sala VIP ningún boleto puede costar más de $180.00 MXN."
                : "El máximo es $90.00 MXN para 2D y $150.00 MXN para 3D o 4D.";
            return RedirectToAction(nameof(PreciosBoletos));
        }
        sala.PrecioAdulto = precioAdulto;
        sala.PrecioAlumno = precioAlumno;
        sala.PrecioNino = precioNino;
        sala.PrecioAdulto3D = precioAdulto3D;
        sala.PrecioAlumno3D = precioAlumno3D;
        sala.PrecioNino3D = precioNino3D;
        sala.PrecioAdulto4D = precioAdulto4D;
        sala.PrecioAlumno4D = precioAlumno4D;
        sala.PrecioNino4D = precioNino4D;
        _context.SaveChanges();
        TempData["Mensaje"] = $"Precios de Sala {sala.Letra} actualizados.";
        return RedirectToAction(nameof(PreciosBoletos));
    }

    private void SincronizarAsientos(Sala sala)
    {
        var existentes = _context.Asientos.Where(a => a.SalaId == sala.Id).ToList();
        var validos = (from fila in Enumerable.Range(0, sala.Filas)
                       from numero in Enumerable.Range(1, sala.Columnas)
                       select $"{(char)('A' + fila)}-{numero}").ToHashSet();
        _context.Asientos.RemoveRange(existentes.Where(a => !validos.Contains($"{a.Fila}-{a.Numero}")));
        var claves = existentes.Select(a => $"{a.Fila}-{a.Numero}").ToHashSet();
        _context.Asientos.AddRange(validos.Where(v => !claves.Contains(v)).Select(v =>
        {
            var partes = v.Split('-');
            return new Asiento { SalaId = sala.Id, Fila = partes[0], Numero = int.Parse(partes[1]) };
        }));
        _context.SaveChanges();
    }

    private void CargarSucursales(int? seleccionada = null)
    {
        ViewBag.Sucursales = _context.Sucursales.Where(s => s.Activa).OrderBy(s => s.Nombre).ToList();
        ViewBag.SucursalId = seleccionada;
    }

    private void ValidarTipoSala(Sala sala)
    {
        if (sala.Tipo is not ("Normal" or "VIP"))
            ModelState.AddModelError(nameof(sala.Tipo), "Selecciona una sala Normal o VIP.");
        if (sala.Formato is not ("2D" or "3D" or "4D"))
            ModelState.AddModelError(nameof(sala.Formato), "Selecciona el formato 2D, 3D o 4D.");
        if (sala.Formato == "3D") sala.Soporta3D = true;
        if (sala.Formato == "4D") sala.Soporta4D = true;
        if (sala.PrecioAdulto < 0 || sala.PrecioAlumno < 0 || sala.PrecioNino < 0)
            ModelState.AddModelError(string.Empty, "Los precios de la sala no pueden ser negativos.");
        var precioMaximo = sala.Tipo == "VIP" ? 180m : 90m;
        if (sala.PrecioAdulto > precioMaximo || sala.PrecioAlumno > precioMaximo || sala.PrecioNino > precioMaximo)
            ModelState.AddModelError(string.Empty, $"El precio máximo para una sala {sala.Tipo} es ${precioMaximo:N2} MXN.");
    }

    public IActionResult Reportes(DateTime? desde, DateTime? hasta)
    {
        var inicio = (desde ?? DateTime.Today).Date; var fin = (hasta ?? DateTime.Today).Date.AddDays(1); if (fin <= inicio) fin = inicio.AddDays(1);
        var ordenes = _context.Ordenes.Include(o => o.Detalles).Where(o => o.Fecha >= inicio && o.Fecha < fin).OrderByDescending(o => o.Fecha).ToList();
        ViewBag.Desde = inicio.ToString("yyyy-MM-dd"); ViewBag.Hasta = fin.AddDays(-1).ToString("yyyy-MM-dd"); ViewBag.Total = ordenes.Sum(o => o.Total); ViewBag.Boletos = ordenes.SelectMany(o => o.Detalles).Where(d => d.Concepto.StartsWith("Boleto")).Sum(d => d.Cantidad); ViewBag.Ordenes = ordenes.Count;
        return View(ordenes);
    }

    // Administración de ventas: consulta, cancelación y liberación de asientos.
    public IActionResult Ventas() => View(_context.Ordenes.Include(o => o.Detalles).OrderByDescending(o => o.Fecha).ToList());
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CancelarVenta(int id, string motivo)
    {
        var orden = _context.Ordenes.Find(id);
        if (orden == null || orden.Estado == "Cancelada") return RedirectToAction(nameof(Ventas));
        orden.Estado = "Cancelada";
        orden.CodigoBeneficio = string.IsNullOrWhiteSpace(motivo) ? "Cancelación administrativa" : $"Cancelada: {motivo}";
        var reservas = _context.ReservasAsientos.Where(r => r.OrdenId == id).ToList();
        _context.ReservasAsientos.RemoveRange(reservas);
        RegistrarBitacora("Administrador", $"Canceló/reembolsó la orden #{id}");
        _context.SaveChanges();
        return RedirectToAction(nameof(Ventas));
    }

    private Horario? BuscarFuncionEnConflicto(int salaId, DateTime fecha, TimeSpan hora, int duracion)
    {
        var inicioNuevo = fecha.Date.Add(hora);
        var finNuevo = inicioNuevo.AddMinutes(duracion);
        return _context.Horarios
            .Include(h => h.Pelicula)
            .Where(h => h.SalaId == salaId
                && h.Fecha >= fecha.Date.AddDays(-1)
                && h.Fecha < fecha.Date.AddDays(2))
            .AsEnumerable()
            .FirstOrDefault(h =>
            {
                var inicioExistente = h.Fecha.Date.Add(h.Hora);
                var finExistente = inicioExistente.AddMinutes(h.Pelicula?.Duracion ?? 0);
                return inicioNuevo < finExistente && inicioExistente < finNuevo;
            });
    }

    // Proveedores
    public IActionResult Proveedores() => View(_context.Proveedores.OrderBy(p => p.Nombre).ToList());
    public IActionResult CrearProveedor() => View();
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearProveedor(Proveedor proveedor) { if (!ModelState.IsValid) return View(proveedor); _context.Proveedores.Add(proveedor); _context.SaveChanges(); return RedirectToAction(nameof(Proveedores)); }
    public IActionResult EditarProveedor(int id) { var proveedor = _context.Proveedores.Find(id); return proveedor == null ? NotFound() : View(proveedor); }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult EditarProveedor(int id, Proveedor proveedor) { if (id != proveedor.Id) return BadRequest(); if (!ModelState.IsValid) return View(proveedor); _context.Update(proveedor); _context.SaveChanges(); return RedirectToAction(nameof(Proveedores)); }

    // Inventario: cada ajuste deja rastro para auditoría.
    public IActionResult Inventario()
    {
        ViewBag.Proveedores = _context.Proveedores.Where(p => p.Activo).OrderBy(p => p.Nombre).ToList();
        ViewBag.Movimientos = _context.MovimientosInventario.OrderByDescending(m => m.Fecha).Take(10).ToList();
        return View(_context.ProductosAlimentos.OrderBy(p => p.Existencia <= p.StockMinimo).ThenBy(p => p.Nombre).ToList());
    }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult AjustarInventario(int productoId, int cantidad, string tipo, string motivo)
    {
        var producto = _context.ProductosAlimentos.Find(productoId);
        if (producto == null || cantidad <= 0) { TempData["Error"] = "Selecciona un producto y una cantidad válida."; return RedirectToAction(nameof(Inventario)); }
        if (tipo == "Salida" && producto.Existencia < cantidad) { TempData["Error"] = "No hay existencias suficientes para registrar la salida."; return RedirectToAction(nameof(Inventario)); }
        producto.Existencia += tipo == "Salida" ? -cantidad : cantidad;
        _context.MovimientosInventario.Add(new MovimientoInventario { ProductoId = productoId, Cantidad = cantidad, Tipo = tipo, Motivo = motivo ?? string.Empty });
        _context.SaveChanges(); return RedirectToAction(nameof(Inventario));
    }

    // Club de cine y promociones
    public IActionResult Club() => View(_context.MiembrosClub.OrderBy(m => m.Nombre).ToList());
    public IActionResult CrearMiembro() => View();
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearMiembro(MiembroClub miembro)
    {
        if (string.IsNullOrWhiteSpace(miembro.Codigo)) miembro.Codigo = $"CLUB{Random.Shared.Next(10000, 99999)}";
        if (_context.MiembrosClub.Any(m => m.Codigo == miembro.Codigo)) ModelState.AddModelError(nameof(miembro.Codigo), "Este código ya existe.");
        if (!ModelState.IsValid) return View(miembro); _context.MiembrosClub.Add(miembro); _context.SaveChanges(); return RedirectToAction(nameof(Club));
    }
    public IActionResult Promociones() => View(_context.Promociones.OrderByDescending(p => p.Inicio).ToList());
    public IActionResult CrearPromocion() => View();
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearPromocion(Promocion promocion) { if (promocion.Fin < promocion.Inicio) ModelState.AddModelError(nameof(promocion.Fin), "La fecha final debe ser posterior a la inicial."); if (!ModelState.IsValid) return View(promocion); _context.Promociones.Add(promocion); _context.SaveChanges(); return RedirectToAction(nameof(Promociones)); }

    // Administración de complejos y personal.
    public IActionResult Sucursales() => View(_context.Sucursales.OrderBy(s => s.Nombre).ToList());
    public IActionResult SucursalDetalle(int id)
    {
        var sucursal = _context.Sucursales
            .Include(s => s.Salas).ThenInclude(s => s.Horarios).ThenInclude(h => h.Pelicula)
            .FirstOrDefault(s => s.Id == id);
        if (sucursal == null) return NotFound();
        ViewBag.Peliculas = sucursal.Salas
            .SelectMany(s => s.Horarios)
            .Where(h => h.Pelicula != null)
            .Select(h => h.Pelicula!)
            .DistinctBy(p => p.Id)
            .OrderBy(p => p.Titulo)
            .ToList();
        ViewBag.Productos = _context.ProductosAlimentos.OrderBy(p => p.Categoria).ThenBy(p => p.Nombre).ToList();
        return View(sucursal);
    }
    public IActionResult CrearSucursal() => View();
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearSucursal(Sucursal sucursal) { if (!ModelState.IsValid) return View(sucursal); _context.Sucursales.Add(sucursal); _context.SaveChanges(); return RedirectToAction(nameof(Sucursales)); }
    public IActionResult Empleados() => View(_context.Empleados.OrderBy(e => e.Nombre).ToList());
    public IActionResult CrearEmpleado() => View();
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearEmpleado(Empleado empleado) { if (!ModelState.IsValid) return View(empleado); _context.Empleados.Add(empleado); _context.SaveChanges(); return RedirectToAction(nameof(Empleados)); }

    // Taquilla y control de efectivo.
    public IActionResult Taquilla() => View(_context.TurnosCaja.OrderByDescending(t => t.Apertura).ToList());
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult AbrirCaja(string cajero, decimal fondoInicial)
    { if (string.IsNullOrWhiteSpace(cajero)) { TempData["Error"] = "Indica el nombre del cajero."; return RedirectToAction(nameof(Taquilla)); } _context.TurnosCaja.Add(new TurnoCaja { Cajero = cajero, FondoInicial = fondoInicial }); _context.SaveChanges(); return RedirectToAction(nameof(Taquilla)); }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CerrarCaja(int id, decimal efectivoFinal, string observaciones)
    { var turno = _context.TurnosCaja.Find(id); if (turno != null && turno.Estado == "Abierto") { turno.EfectivoFinal = efectivoFinal; turno.Observaciones = observaciones ?? string.Empty; turno.Cierre = DateTime.Now; turno.Estado = "Cerrado"; _context.SaveChanges(); } return RedirectToAction(nameof(Taquilla)); }

    // Servicio, mantenimiento y activos.
    public IActionResult Soporte() => View(_context.TicketsSoporte.OrderByDescending(t => t.Fecha).ToList());
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearTicket(TicketSoporte ticket) { if (string.IsNullOrWhiteSpace(ticket.Descripcion)) { TempData["Error"] = "Describe el caso de soporte."; return RedirectToAction(nameof(Soporte)); } _context.TicketsSoporte.Add(ticket); _context.SaveChanges(); return RedirectToAction(nameof(Soporte)); }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult ResolverTicket(int id, string resolucion) { var ticket = _context.TicketsSoporte.Find(id); if (ticket != null) { ticket.Estado = "Resuelto"; ticket.Resolucion = resolucion ?? string.Empty; _context.SaveChanges(); } return RedirectToAction(nameof(Soporte)); }
    public IActionResult Mantenimiento() => View(_context.OrdenesMantenimiento.OrderByDescending(o => o.Fecha).ToList());
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearOrdenMantenimiento(OrdenMantenimiento orden) { if (string.IsNullOrWhiteSpace(orden.Descripcion)) { TempData["Error"] = "Describe la orden de trabajo."; return RedirectToAction(nameof(Mantenimiento)); } _context.OrdenesMantenimiento.Add(orden); _context.SaveChanges(); return RedirectToAction(nameof(Mantenimiento)); }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CambiarEstadoMantenimiento(int id, string estado) { var orden = _context.OrdenesMantenimiento.Find(id); if (orden != null) { orden.Estado = estado; _context.SaveChanges(); } return RedirectToAction(nameof(Mantenimiento)); }
    public IActionResult Activos() => View(_context.Activos.OrderBy(a => a.Categoria).ThenBy(a => a.Nombre).ToList());
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearActivo(Activo activo) { if (!ModelState.IsValid) return RedirectToAction(nameof(Activos)); _context.Activos.Add(activo); _context.SaveChanges(); return RedirectToAction(nameof(Activos)); }

    // Finanzas: egresos, cuentas por pagar y control de flujo de efectivo.
    public IActionResult Finanzas()
    {
        var movimientos = _context.MovimientosFinancieros.OrderByDescending(m => m.Fecha).ToList();
        var ordenesPagadas = _context.Ordenes
            .Include(o => o.Detalles)
            .Where(o => o.Estado == "Pagada")
            .OrderByDescending(o => o.Fecha)
            .ToList();
        var ingresosManuales = movimientos.Where(m => m.Tipo == "Ingreso").Sum(m => m.Monto);
        var egresos = movimientos.Where(m => m.Tipo == "Egreso").Sum(m => m.Monto);
        var totalVentas = ordenesPagadas.Sum(o => o.Total);
        var detalles = ordenesPagadas.SelectMany(o => o.Detalles).ToList();
        var ventasBoletos = detalles
            .Where(d => d.Concepto.StartsWith("Boleto", StringComparison.OrdinalIgnoreCase))
            .Sum(d => d.PrecioUnitario * d.Cantidad);
        var ventasDulceria = detalles
            .Where(d => !d.Concepto.StartsWith("Boleto", StringComparison.OrdinalIgnoreCase))
            .Sum(d => d.PrecioUnitario * d.Cantidad);
        var inicioGrafica = DateTime.Today.AddDays(-6);
        var ventasDiarias = Enumerable.Range(0, 7)
            .Select(i => inicioGrafica.AddDays(i))
            .Select(fecha => new
            {
                Etiqueta = fecha.ToString("ddd dd"),
                Total = ordenesPagadas
                    .Where(o => o.Fecha.Date == fecha)
                    .Sum(o => o.Total)
            })
            .ToList();

        ViewBag.Ingresos = ingresosManuales;
        ViewBag.Egresos = egresos;
        ViewBag.TotalVentas = totalVentas;
        ViewBag.CantidadVentas = ordenesPagadas.Count;
        ViewBag.VentasBoletos = ventasBoletos;
        ViewBag.VentasDulceria = ventasDulceria;
        ViewBag.ArticulosVendidos = detalles.Sum(d => d.Cantidad);
        ViewBag.FlujoNeto = totalVentas + ingresosManuales - egresos;
        ViewBag.EtiquetasVentas = System.Text.Json.JsonSerializer.Serialize(ventasDiarias.Select(v => v.Etiqueta));
        ViewBag.DatosVentas = System.Text.Json.JsonSerializer.Serialize(ventasDiarias.Select(v => v.Total));
        return View(movimientos);
    }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearMovimientoFinanciero(MovimientoFinanciero movimiento) { if (string.IsNullOrWhiteSpace(movimiento.Concepto) || movimiento.Monto <= 0) { TempData["Error"] = "Captura un concepto y monto válidos."; return RedirectToAction(nameof(Finanzas)); } _context.MovimientosFinancieros.Add(movimiento); _context.SaveChanges(); return RedirectToAction(nameof(Finanzas)); }

    // Seguridad administrativa, roles y trazabilidad de acciones.
    public IActionResult Seguridad()
    {
        ViewBag.Bitacora = _context.BitacorasAuditoria.OrderByDescending(b => b.Fecha).Take(15).ToList();
        return View(_context.UsuariosSistema.OrderBy(u => u.Rol).ThenBy(u => u.Nombre).ToList());
    }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CrearUsuario(UsuarioSistema nuevoUsuario)
    {
        if (string.IsNullOrWhiteSpace(nuevoUsuario.Nombre) || string.IsNullOrWhiteSpace(nuevoUsuario.Usuario)) { TempData["Error"] = "Captura nombre y usuario."; return RedirectToAction(nameof(Seguridad)); }
        if (_context.UsuariosSistema.Any(u => u.Usuario == nuevoUsuario.Usuario)) { TempData["Error"] = "El usuario ya existe."; return RedirectToAction(nameof(Seguridad)); }
        _context.UsuariosSistema.Add(nuevoUsuario); RegistrarBitacora("Administrador", $"Creó el usuario {nuevoUsuario.Usuario} con rol {nuevoUsuario.Rol}"); _context.SaveChanges(); return RedirectToAction(nameof(Seguridad));
    }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CambiarEstadoUsuario(int id)
    { var usuario = _context.UsuariosSistema.Find(id); if (usuario != null) { usuario.Activo = !usuario.Activo; RegistrarBitacora("Administrador", $"Cambió el estado del usuario {usuario.Usuario}"); _context.SaveChanges(); } return RedirectToAction(nameof(Seguridad)); }

    // Checklists, incidentes y validación simulada de acceso por QR para demostración.
    public IActionResult OperacionSalas() => View(_context.OperacionesSala.OrderByDescending(o => o.Fecha).ToList());
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult RegistrarOperacionSala(OperacionSala operacion)
    { if (string.IsNullOrWhiteSpace(operacion.Sala) || string.IsNullOrWhiteSpace(operacion.Descripcion)) { TempData["Error"] = "Indica sala y descripción."; return RedirectToAction(nameof(OperacionSalas)); } _context.OperacionesSala.Add(operacion); RegistrarBitacora("Operación", $"Registró {operacion.Tipo} en {operacion.Sala}"); _context.SaveChanges(); return RedirectToAction(nameof(OperacionSalas)); }
    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult CompletarOperacionSala(int id)
    { var operacion = _context.OperacionesSala.Find(id); if (operacion != null) { operacion.Estado = "Completado"; RegistrarBitacora("Operación", $"Completó operación en {operacion.Sala}"); _context.SaveChanges(); } return RedirectToAction(nameof(OperacionSalas)); }

    private void RegistrarBitacora(string usuario, string accion) => _context.BitacorasAuditoria.Add(new BitacoraAuditoria { Usuario = usuario, Accion = accion });

    // Dulcería
    public IActionResult Dulceria()
    {
        var productos = _context.ProductosAlimentos.OrderBy(p => p.Nombre).ToList();
        return View(productos);
    }

    public IActionResult CrearProducto()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult CrearProducto(ProductoAlimento producto, IFormFile? imagenArchivo)
    {
        // ImagenUrl es opcional y puede ser reemplazada por el archivo después del model binding.
        ModelState.Remove(nameof(producto.ImagenUrl));
        ValidarProducto(producto);
        if (!GuardarImagenProducto(imagenArchivo, producto, out var error))
            ModelState.AddModelError("imagenArchivo", error);
        if (ModelState.IsValid)
        {
            _context.ProductosAlimentos.Add(producto);
            _context.SaveChanges();
            TempData["Mensaje"] = $"El producto \"{producto.Nombre}\" se guardó correctamente.";
            return RedirectToAction(nameof(Dulceria));
        }

        return View(producto);
    }

    public IActionResult EditarProducto(int id)
    {
        var producto = _context.ProductosAlimentos.Find(id);
        if (producto == null) return NotFound();
        return View(producto);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult EditarProducto(int id, ProductoAlimento producto, IFormFile? imagenArchivo)
    {
        if (id != producto.Id) return BadRequest();

        ModelState.Remove(nameof(producto.ImagenUrl));
        ValidarProducto(producto);
        if (!GuardarImagenProducto(imagenArchivo, producto, out var error))
            ModelState.AddModelError("imagenArchivo", error);

        if (ModelState.IsValid)
        {
            _context.Update(producto);
            _context.SaveChanges();
            TempData["Mensaje"] = $"El producto \"{producto.Nombre}\" se actualizó correctamente.";
            return RedirectToAction(nameof(Dulceria));
        }

        return View(producto);
    }

    private void ValidarProducto(ProductoAlimento producto)
    {
        producto.Nombre = producto.Nombre?.Trim() ?? string.Empty;
        producto.Descripcion = producto.Descripcion?.Trim() ?? string.Empty;
        producto.Categoria = producto.Categoria?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(producto.Nombre))
            ModelState.AddModelError(nameof(producto.Nombre), "Escribe el nombre del combo o producto.");
        if (string.IsNullOrWhiteSpace(producto.Descripcion))
            ModelState.AddModelError(nameof(producto.Descripcion), "Escribe una descripción.");
        if (producto.Precio <= 0)
            ModelState.AddModelError(nameof(producto.Precio), "El precio debe ser mayor que cero.");
        if (producto.Existencia < 0)
            ModelState.AddModelError(nameof(producto.Existencia), "La existencia no puede ser negativa.");
        if (producto.StockMinimo < 0)
            ModelState.AddModelError(nameof(producto.StockMinimo), "El stock mínimo no puede ser negativo.");
        if (producto.CantidadBebidas is < 0 or > 6)
            ModelState.AddModelError(nameof(producto.CantidadBebidas), "El combo puede incluir entre 0 y 6 bebidas.");
        var tamanosPermitidos = new[] { "No aplica", "Chicas", "Medianas", "Grandes", "Cualquier tamaño" };
        if (!tamanosPermitidos.Contains(producto.TamanoPalomitas))
            ModelState.AddModelError(nameof(producto.TamanoPalomitas), "Selecciona una opción válida para las palomitas.");
        var tamanosNachosPermitidos = new[] { "No aplica", "Chicos", "Medianos", "Grandes", "Cualquier tamaño" };
        if (!tamanosNachosPermitidos.Contains(producto.TamanoNachos))
            ModelState.AddModelError(nameof(producto.TamanoNachos), "Selecciona una opción válida para los nachos.");
    }

    private static bool GuardarImagenProducto(IFormFile? imagenArchivo, ProductoAlimento producto, out string error)
    {
        error = string.Empty;
        if (imagenArchivo == null || imagenArchivo.Length == 0) return true;
        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var extension = Path.GetExtension(imagenArchivo.FileName).ToLowerInvariant();
        if (!extensionesPermitidas.Contains(extension)) { error = "Selecciona una imagen JPG, PNG, WEBP o GIF."; return false; }
        if (imagenArchivo.Length > 5 * 1024 * 1024) { error = "La imagen no puede superar 5 MB."; return false; }
        var carpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "dulceria");
        Directory.CreateDirectory(carpeta);
        var nombre = $"{Guid.NewGuid():N}{extension}";
        using var archivo = System.IO.File.Create(Path.Combine(carpeta, nombre));
        imagenArchivo.CopyTo(archivo);
        producto.ImagenUrl = $"/uploads/dulceria/{nombre}";
        return true;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult EliminarProducto(int id)
    {
        var producto = _context.ProductosAlimentos.Find(id);
        if (producto != null)
        {
            _context.ProductosAlimentos.Remove(producto);
            _context.SaveChanges();
        }

        return RedirectToAction(nameof(Dulceria));
    }
}
