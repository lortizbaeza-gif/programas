namespace Cine.Models;
public class MiembroClub
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Nivel { get; set; } = "Clásico";
    public decimal DescuentoPorcentaje { get; set; } = 5;
    public int Puntos { get; set; }
    public bool Activo { get; set; } = true;
}
