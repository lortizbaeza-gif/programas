using Cine.Models;
using Microsoft.EntityFrameworkCore;

namespace Cine.Data;

public class CineDbContext : DbContext
{
    public CineDbContext(DbContextOptions<CineDbContext> options) : base(options)
    {
    }

    public DbSet<Pelicula> Peliculas => Set<Pelicula>();
    public DbSet<Horario> Horarios => Set<Horario>();
    public DbSet<Sala> Salas => Set<Sala>();
    public DbSet<Asiento> Asientos => Set<Asiento>();
    public DbSet<ProductoAlimento> ProductosAlimentos => Set<ProductoAlimento>();
    public DbSet<Orden> Ordenes => Set<Orden>();
    public DbSet<DetalleOrden> DetallesOrden => Set<DetalleOrden>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<MiembroClub> MiembrosClub => Set<MiembroClub>();
    public DbSet<Promocion> Promociones => Set<Promocion>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<TurnoCaja> TurnosCaja => Set<TurnoCaja>();
    public DbSet<TicketSoporte> TicketsSoporte => Set<TicketSoporte>();
    public DbSet<OrdenMantenimiento> OrdenesMantenimiento => Set<OrdenMantenimiento>();
    public DbSet<Activo> Activos => Set<Activo>();
    public DbSet<MovimientoFinanciero> MovimientosFinancieros => Set<MovimientoFinanciero>();
    public DbSet<UsuarioSistema> UsuariosSistema => Set<UsuarioSistema>();
    public DbSet<BitacoraAuditoria> BitacorasAuditoria => Set<BitacoraAuditoria>();
    public DbSet<OperacionSala> OperacionesSala => Set<OperacionSala>();
    public DbSet<ReservaAsiento> ReservasAsientos => Set<ReservaAsiento>();
    public DbSet<ConfiguracionBoletos> ConfiguracionesBoletos => Set<ConfiguracionBoletos>();
    public DbSet<PeliculaSala> PeliculasSalas => Set<PeliculaSala>();
}
