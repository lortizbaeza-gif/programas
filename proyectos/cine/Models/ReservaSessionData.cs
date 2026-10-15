namespace Cine.Models;

public class ReservaSessionData
{
    public int HorarioId { get; set; }
    public int Adultos { get; set; }
    public int Alumnos { get; set; }
    public int Ninos { get; set; }
    public List<int> AsientosSeleccionados { get; set; } = new();
    public int TotalBoletos => Adultos + Alumnos + Ninos;
}
