namespace Cine.Models;
public class Empleado
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Puesto { get; set; } = "Cajero";
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Turno { get; set; } = "Matutino";
    public decimal Salario { get; set; }
    public bool Activo { get; set; } = true;
}
