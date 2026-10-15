namespace Cine.Models;
public class OrdenMantenimiento
{
    public int Id { get; set; }
    public string Area { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Prioridad { get; set; } = "Media";
    public string Estado { get; set; } = "Pendiente";
    public string Responsable { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.Now;
}
