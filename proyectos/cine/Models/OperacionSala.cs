namespace Cine.Models;
public class OperacionSala
{
    public int Id { get; set; }
    public string Sala { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Checklist";
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = "Pendiente";
    public DateTime Fecha { get; set; } = DateTime.Now;
}
