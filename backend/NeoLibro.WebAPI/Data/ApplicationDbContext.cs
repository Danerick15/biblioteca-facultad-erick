using Microsoft.EntityFrameworkCore;
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Reserva> Reservas { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }
        public DbSet<Libro> Libros { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Prestamo> Prestamos { get; set; }
        public DbSet<Ejemplar> Ejemplares { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuración de índices
            modelBuilder.Entity<Reserva>()
                .HasIndex(r => new { r.TipoReserva, r.Estado, r.EstadoNotificacion });

            modelBuilder.Entity<Notificacion>()
                .HasIndex(n => new { n.Estado, n.UsuarioID });

            // Configuración de relaciones
            modelBuilder.Entity<Reserva>()
                .HasOne(r => r.Libro)
                .WithMany()
                .HasForeignKey(r => r.LibroID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reserva>()
                .HasOne(r => r.Usuario)
                .WithMany()
                .HasForeignKey(r => r.UsuarioID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notificacion>()
                .HasOne(n => n.Reserva)
                .WithMany()
                .HasForeignKey(n => n.ReservaID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notificacion>()
                .HasOne(n => n.Usuario)
                .WithMany()
                .HasForeignKey(n => n.UsuarioID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}