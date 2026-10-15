namespace Cine.Models;
public class BitacoraAuditoria
{
    public int Id { get; set; }
    public string Usuario { get; set; } = "Administrador";
    public string Accion { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.Now;
}
