namespace Cine.Models;
public class Sucursal
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public string HorarioApertura { get; set; } = "10:00";
    public string HorarioCierre { get; set; } = "23:00";
    public bool Activa { get; set; } = true;
    public ICollection<Sala> Salas { get; set; } = new List<Sala>();
}
