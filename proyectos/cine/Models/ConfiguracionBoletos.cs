using System.ComponentModel.DataAnnotations;

namespace Cine.Models;

public class ConfiguracionBoletos
{
    public int Id { get; set; }

    [Range(0, 10000)]
    public decimal PrecioAdulto { get; set; } = 150m;

    [Range(0, 10000)]
    public decimal PrecioAlumno { get; set; } = 120m;

    [Range(0, 10000)]
    public decimal PrecioNino { get; set; } = 90m;
}
