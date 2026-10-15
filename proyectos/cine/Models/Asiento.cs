namespace Cine.Models;

public class Asiento
{
    public int Id { get; set; }
    public string Fila { get; set; } = string.Empty;
    public int Numero { get; set; }
    public bool Ocupado { get; set; }
    public bool Seleccionado { get; set; }
    public int SalaId { get; set; }
    public Sala? Sala { get; set; }
}
