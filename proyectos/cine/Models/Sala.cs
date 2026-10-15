namespace Cine.Models;

public class Sala
{
    public int Id { get; set; }
    public int SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Letra { get; set; } = "A";
    public string Tipo { get; set; } = "Normal";
    public string Formato { get; set; } = "2D";
    public bool Soporta3D { get; set; }
    public bool Soporta4D { get; set; }
    public decimal PrecioAdulto { get; set; } = 90m;
    public decimal PrecioAlumno { get; set; } = 75m;
    public decimal PrecioNino { get; set; } = 60m;
    public decimal PrecioAdulto3D { get; set; } = 150m;
    public decimal PrecioAlumno3D { get; set; } = 135m;
    public decimal PrecioNino3D { get; set; } = 120m;
    public decimal PrecioAdulto4D { get; set; } = 150m;
    public decimal PrecioAlumno4D { get; set; } = 135m;
    public decimal PrecioNino4D { get; set; } = 120m;
    public int Filas { get; set; } = 8;
    public int Columnas { get; set; } = 10;
    public int PasilloDespuesColumna { get; set; } = 5;

    public ICollection<Horario> Horarios { get; set; } = new List<Horario>();
    public ICollection<PeliculaSala> PeliculasSalas { get; set; } = new List<PeliculaSala>();
}
