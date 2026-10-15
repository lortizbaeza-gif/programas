using Cine.Models;
using Microsoft.EntityFrameworkCore;

namespace Cine.Data;

public static class DbInitializer
{
    public static void Initialize(CineDbContext context)
    {
        // Asegurarse de que la base de datos ha sido creada.
        context.Database.EnsureCreated();
        // Campos configurables de los combos para bases de datos existentes.
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN CantidadBebidas INTEGER NOT NULL DEFAULT 0");
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN TamanoPalomitas VARCHAR(30) NOT NULL DEFAULT 'No aplica'");
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN TamanoNachos VARCHAR(30) NOT NULL DEFAULT 'No aplica'");
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN PermiteExtraQueso BOOLEAN NOT NULL DEFAULT FALSE");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN SucursalId INTEGER NOT NULL DEFAULT 0");
        Ejecutar(context, "UPDATE Peliculas SET Clasificacion = 'AA' WHERE Clasificacion = 'G'");
        Ejecutar(context, "UPDATE Peliculas SET Clasificacion = 'A' WHERE Clasificacion = 'PG'");
        Ejecutar(context, "UPDATE Peliculas SET Clasificacion = 'B' WHERE Clasificacion = 'PG-13'");
        Ejecutar(context, "UPDATE Peliculas SET Clasificacion = 'C' WHERE Clasificacion = 'R'");
        Ejecutar(context, "UPDATE Peliculas SET Clasificacion = 'D' WHERE Clasificacion = 'NC-17'");
        Ejecutar(context, "UPDATE Peliculas SET Genero = 'Biografía' WHERE Genero = 'Biográfica' OR Genero = 'Biografica' OR Genero = 'Biografia'");
        if (!context.Sucursales.Any())
        {
            context.Sucursales.Add(new Sucursal
            {
                Nombre = "CINE+ Centro",
                Ciudad = "Mérida",
                Direccion = "Centro",
                HorarioApertura = "10:00",
                HorarioCierre = "23:00",
                Activa = true
            });
            context.SaveChanges();
        }
        var sucursalInicial = context.Sucursales.OrderBy(s => s.Id).Select(s => s.Id).First();
        Ejecutar(context, $"UPDATE Salas SET SucursalId = {sucursalInicial} WHERE SucursalId = 0");
        Ejecutar(context, "UPDATE Salas SET PrecioAdulto = LEAST(PrecioAdulto, 180), PrecioAlumno = LEAST(PrecioAlumno, 180), PrecioNino = LEAST(PrecioNino, 180), PrecioAdulto3D = LEAST(PrecioAdulto3D, 180), PrecioAlumno3D = LEAST(PrecioAlumno3D, 180), PrecioNino3D = LEAST(PrecioNino3D, 180), PrecioAdulto4D = LEAST(PrecioAdulto4D, 180), PrecioAlumno4D = LEAST(PrecioAlumno4D, 180), PrecioNino4D = LEAST(PrecioNino4D, 180) WHERE Tipo = 'VIP'");
        Ejecutar(context, "UPDATE Salas SET PrecioAdulto = LEAST(PrecioAdulto, 90), PrecioAlumno = LEAST(PrecioAlumno, 90), PrecioNino = LEAST(PrecioNino, 90), PrecioAdulto3D = LEAST(PrecioAdulto3D, 150), PrecioAlumno3D = LEAST(PrecioAlumno3D, 150), PrecioNino3D = LEAST(PrecioNino3D, 150), PrecioAdulto4D = LEAST(PrecioAdulto4D, 150), PrecioAlumno4D = LEAST(PrecioAlumno4D, 150), PrecioNino4D = LEAST(PrecioNino4D, 150) WHERE Tipo <> 'VIP'");
        if (!context.ConfiguracionesBoletos.Any())
        {
            context.ConfiguracionesBoletos.Add(new ConfiguracionBoletos());
            context.SaveChanges();
        }
        if (context.Horarios.Any())
        {
            var asignadas = context.PeliculasSalas.Select(ps => new { ps.PeliculaId, ps.SalaId }).ToList();
            var faltantes = context.Horarios
                .Select(h => new { h.PeliculaId, h.SalaId })
                .Distinct()
                .AsEnumerable()
                .Where(h => !asignadas.Any(a => a.PeliculaId == h.PeliculaId && a.SalaId == h.SalaId))
                .Select(h => new PeliculaSala { PeliculaId = h.PeliculaId, SalaId = h.SalaId })
                .ToList();
            if (faltantes.Count > 0)
            {
                context.PeliculasSalas.AddRange(faltantes);
                context.SaveChanges();
            }
        }

        // Inventario inicial para instalaciones que ya tenían productos antes de este módulo.
        if (!context.MovimientosInventario.Any() && context.ProductosAlimentos.Any(p => p.Existencia == 0))
        {
            foreach (var producto in context.ProductosAlimentos.Where(p => p.Existencia == 0))
                producto.Existencia = 25;
            context.SaveChanges();
        }

        // Buscar si ya hay películas.
        if (context.Peliculas.Any())
        {
            return;   // La base de datos ya ha sido inicializada.
        }

        var peliculas = new Pelicula[]
        {
            new() { Titulo = "Dune: Parte Dos", Sinopsis = "Paul Atreides se enfrenta a un futuro aún más peligroso en el desierto del planeta Arrakis.", Director = "Denis Villeneuve", Genero = "Ciencia Ficción", Duracion = 166, Clasificacion = "PG-13", PosterUrl = "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=800&q=80" },
            new() { Titulo = "Oppenheimer", Sinopsis = "La historia del científico que cambió la historia de la humanidad con el desarrollo de la bomba atómica.", Director = "Christopher Nolan", Genero = "Biográfica", Duracion = 180, Clasificacion = "R", PosterUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80" },
            new() { Titulo = "Barbie", Sinopsis = "Barbie y Ken viven una aventura inesperada que pone a prueba su mundo perfecto.", Director = "Greta Gerwig", Genero = "Comedia", Duracion = 114, Clasificacion = "PG", PosterUrl = "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80" },
            new() { Titulo = "Interstellar", Sinopsis = "Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.", Director = "Christopher Nolan", Genero = "Ciencia Ficción", Duracion = 169, Clasificacion = "PG-13", PosterUrl = "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80" }
        };
        context.Peliculas.AddRange(peliculas);
        // Guardamos las películas para que EF Core les asigne un Id.
        context.SaveChanges();

        var salas = new Sala[]
        {
            new() { Nombre = "VIP", Letra = "A", Tipo = "VIP", Formato = "3D", Soporta3D = true, Filas = 5, Columnas = 10, PrecioAdulto = 230m, PrecioAlumno = 190m, PrecioNino = 150m },
            new() { Nombre = "Normal / 3D", Letra = "B", Tipo = "Normal", Formato = "2D", Soporta3D = true, Filas = 6, Columnas = 12, PasilloDespuesColumna = 6 },
            new() { Nombre = "4D", Letra = "F", Tipo = "Normal", Formato = "4D", Soporta4D = true, Filas = 5, Columnas = 8, PasilloDespuesColumna = 4, PrecioAdulto = 260m, PrecioAlumno = 220m, PrecioNino = 180m }
        };
        context.Salas.AddRange(salas);
        // Guardamos las salas para que EF Core les asigne un Id.
        context.SaveChanges();

        var horarios = new Horario[]
        {
            new() { PeliculaId = peliculas[0].Id, SalaId = salas[0].Id, Fecha = DateTime.Today.AddDays(1), Hora = new TimeSpan(18, 30, 0) },
            new() { PeliculaId = peliculas[0].Id, SalaId = salas[1].Id, Fecha = DateTime.Today.AddDays(1), Hora = new TimeSpan(21, 0, 0) },
            new() { PeliculaId = peliculas[1].Id, SalaId = salas[0].Id, Fecha = DateTime.Today.AddDays(2), Hora = new TimeSpan(19, 0, 0) },
            new() { PeliculaId = peliculas[2].Id, SalaId = salas[1].Id, Fecha = DateTime.Today.AddDays(2), Hora = new TimeSpan(20, 30, 0) }
        };
        context.Horarios.AddRange(horarios);
        context.SaveChanges();
        context.PeliculasSalas.AddRange(horarios
            .Select(h => new { h.PeliculaId, h.SalaId })
            .Distinct()
            .Select(x => new PeliculaSala { PeliculaId = x.PeliculaId, SalaId = x.SalaId }));
        context.SaveChanges();

        var productos = new ProductoAlimento[]
        {
            new() { Nombre = "Combo Clásico", Categoria = "Combo", Descripcion = "Palomitas medianas + refresco grande", Precio = 180m, ImagenUrl = "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=800&q=80" },
            new() { Nombre = "Palomitas Premium", Categoria = "Palomitas", Descripcion = "Sabor mantequilla con caramelo", Precio = 120m, ImagenUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80" },
            new() { Nombre = "Refresco Giant", Categoria = "Bebida", Descripcion = "Grande, hielo y sabor intenso", Precio = 95m, ImagenUrl = "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80" },
            new() { Nombre = "Hot Dog Deluxe", Categoria = "Extra", Descripcion = "Con salsa y papas", Precio = 110m, ImagenUrl = "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80" }
        };
        context.ProductosAlimentos.AddRange(productos);
        context.SaveChanges();
    }

    private static void CrearEstructuraAdministrativa(CineDbContext context)
    {
        // Compatibilidad con la base existente: no se borra información del cine.
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN Existencia INTEGER NOT NULL DEFAULT 0");
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN StockMinimo INTEGER NOT NULL DEFAULT 5");
        Ejecutar(context, "ALTER TABLE ProductosAlimentos ADD COLUMN ProveedorId INTEGER NULL");
        Ejecutar(context, "ALTER TABLE Ordenes ADD COLUMN Descuento TEXT NOT NULL DEFAULT '0'");
        Ejecutar(context, "ALTER TABLE Ordenes ADD COLUMN CodigoBeneficio TEXT NOT NULL DEFAULT ''");
        Ejecutar(context, "ALTER TABLE Ordenes ADD COLUMN MiembroClubId INTEGER NULL");
        Ejecutar(context, "ALTER TABLE Ordenes ADD COLUMN Estado TEXT NOT NULL DEFAULT 'Pagada'");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS Proveedores (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Contacto TEXT NOT NULL, Telefono TEXT NOT NULL, Email TEXT NOT NULL, Activo INTEGER NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS MovimientosInventario (Id INTEGER PRIMARY KEY AUTOINCREMENT, ProductoId INTEGER NOT NULL, Tipo TEXT NOT NULL, Cantidad INTEGER NOT NULL, Motivo TEXT NOT NULL, Fecha TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS MiembrosClub (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Email TEXT NOT NULL, Telefono TEXT NOT NULL, Codigo TEXT NOT NULL, Nivel TEXT NOT NULL, DescuentoPorcentaje TEXT NOT NULL, Puntos INTEGER NOT NULL, Activo INTEGER NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS Promociones (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Codigo TEXT NOT NULL, DescuentoPorcentaje TEXT NOT NULL, Inicio TEXT NOT NULL, Fin TEXT NOT NULL, Activa INTEGER NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS Sucursales (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Direccion TEXT NOT NULL, Ciudad TEXT NOT NULL, HorarioApertura TEXT NOT NULL, HorarioCierre TEXT NOT NULL, Activa INTEGER NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS Empleados (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Puesto TEXT NOT NULL, Telefono TEXT NOT NULL, Email TEXT NOT NULL, Turno TEXT NOT NULL, Salario TEXT NOT NULL, Activo INTEGER NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS TurnosCaja (Id INTEGER PRIMARY KEY AUTOINCREMENT, Cajero TEXT NOT NULL, Apertura TEXT NOT NULL, Cierre TEXT NULL, FondoInicial TEXT NOT NULL, EfectivoFinal TEXT NOT NULL, Estado TEXT NOT NULL, Observaciones TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS TicketsSoporte (Id INTEGER PRIMARY KEY AUTOINCREMENT, Cliente TEXT NOT NULL, Tipo TEXT NOT NULL, Descripcion TEXT NOT NULL, Estado TEXT NOT NULL, Fecha TEXT NOT NULL, Resolucion TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS OrdenesMantenimiento (Id INTEGER PRIMARY KEY AUTOINCREMENT, Area TEXT NOT NULL, Descripcion TEXT NOT NULL, Prioridad TEXT NOT NULL, Estado TEXT NOT NULL, Responsable TEXT NOT NULL, Fecha TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS Activos (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Categoria TEXT NOT NULL, Ubicacion TEXT NOT NULL, Valor TEXT NOT NULL, Estado TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS MovimientosFinancieros (Id INTEGER PRIMARY KEY AUTOINCREMENT, Tipo TEXT NOT NULL, Concepto TEXT NOT NULL, Monto TEXT NOT NULL, Categoria TEXT NOT NULL, Fecha TEXT NOT NULL, Estado TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS UsuariosSistema (Id INTEGER PRIMARY KEY AUTOINCREMENT, Nombre TEXT NOT NULL, Usuario TEXT NOT NULL, Rol TEXT NOT NULL, Activo INTEGER NOT NULL, DobleFactor INTEGER NOT NULL, Creado TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS BitacorasAuditoria (Id INTEGER PRIMARY KEY AUTOINCREMENT, Usuario TEXT NOT NULL, Accion TEXT NOT NULL, Fecha TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS OperacionesSala (Id INTEGER PRIMARY KEY AUTOINCREMENT, Sala TEXT NOT NULL, Tipo TEXT NOT NULL, Descripcion TEXT NOT NULL, Estado TEXT NOT NULL, Fecha TEXT NOT NULL)");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS ReservasAsientos (Id INTEGER PRIMARY KEY AUTOINCREMENT, HorarioId INTEGER NOT NULL, AsientoId INTEGER NOT NULL, OrdenId INTEGER NOT NULL, Fecha TEXT NOT NULL)");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PasilloDespuesColumna INTEGER NOT NULL DEFAULT 5");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN Tipo TEXT NOT NULL DEFAULT 'Normal'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN Formato TEXT NOT NULL DEFAULT '2D'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN Letra TEXT NOT NULL DEFAULT 'A'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN Soporta3D INTEGER NOT NULL DEFAULT 0");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN Soporta4D INTEGER NOT NULL DEFAULT 0");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioAdulto TEXT NOT NULL DEFAULT '150'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioAlumno TEXT NOT NULL DEFAULT '120'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioNino TEXT NOT NULL DEFAULT '90'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioAdulto3D TEXT NOT NULL DEFAULT '190'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioAlumno3D TEXT NOT NULL DEFAULT '155'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioNino3D TEXT NOT NULL DEFAULT '120'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioAdulto4D TEXT NOT NULL DEFAULT '260'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioAlumno4D TEXT NOT NULL DEFAULT '220'");
        Ejecutar(context, "ALTER TABLE Salas ADD COLUMN PrecioNino4D TEXT NOT NULL DEFAULT '180'");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS PeliculasSalas (Id INTEGER PRIMARY KEY AUTOINCREMENT, PeliculaId INTEGER NOT NULL, SalaId INTEGER NOT NULL)");
        Ejecutar(context, "ALTER TABLE Horarios ADD COLUMN FormatoFuncion TEXT NOT NULL DEFAULT '2D'");
        Ejecutar(context, "UPDATE Salas SET Letra = CHAR(64 + Id) WHERE Letra = 'A' AND Id > 1 AND Id <= 6");
        Ejecutar(context, "UPDATE Salas SET Soporta3D = 1 WHERE Formato = '3D'");
        Ejecutar(context, "UPDATE Salas SET Soporta4D = 1 WHERE Formato = '4D'");
        Ejecutar(context, "UPDATE Salas SET Tipo = 'VIP' WHERE UPPER(Nombre) LIKE '%VIP%'");
        Ejecutar(context, "UPDATE Salas SET PrecioAdulto = '230', PrecioAlumno = '190', PrecioNino = '150' WHERE Tipo = 'VIP' AND PrecioAdulto = '150' AND PrecioAlumno = '120' AND PrecioNino = '90'");
        Ejecutar(context, "UPDATE Salas SET PrecioAdulto = '260', PrecioAlumno = '220', PrecioNino = '180' WHERE Soporta4D = 1 AND PrecioAdulto = '150' AND PrecioAlumno = '120' AND PrecioNino = '90'");
        Ejecutar(context, "CREATE TABLE IF NOT EXISTS ConfiguracionesBoletos (Id INTEGER PRIMARY KEY AUTOINCREMENT, PrecioAdulto TEXT NOT NULL, PrecioAlumno TEXT NOT NULL, PrecioNino TEXT NOT NULL)");
    }

    private static void Ejecutar(CineDbContext context, string sql)
    {
        try { context.Database.ExecuteSqlRaw(sql); }
        catch { /* La columna ya existe o fue creada por EnsureCreated. */ }
    }
}
