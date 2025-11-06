import React, { useEffect, useState } from 'react';
import PageLoader from '../../../../components/PageLoader';
import { obtenerMisReservas, cancelarReserva, type ReservaDTO } from '../../../../api/reservas';
import { Calendar, X, BookOpen } from 'lucide-react';
import './MyReservations.css';

const MyReservations: React.FC = () => {
	const [reservas, setReservas] = useState<ReservaDTO[]>([]);
	const [cargando, setCargando] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [cancelandoId, setCancelandoId] = useState<number | null>(null);

	const cargar = async () => {
		try {
			setCargando(true);
			setError(null);
			const data = await obtenerMisReservas();
			
			// Si la respuesta es exitosa, establecer los datos (aunque sea un array vacío)
			// Un array vacío es válido, no es un error
			setReservas(Array.isArray(data) ? data : []);
			setError(null);
		} catch (e: unknown) {
			const error = e as any;
			
			// Solo mostrar error si es un error HTTP real (status >= 400)
			if (error?.response?.status >= 400) {
				const mensaje = 
					error?.response?.data?.mensaje || 
					error?.response?.data?.detalle || 
					'Error al obtener las reservas';
				setError(mensaje);
			} else {
				// Para otros errores (red, timeout, etc.), no mostrar error
				// Solo establecer lista vacía
				setError(null);
			}
			setReservas([]);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargar();
	}, []);

	const onCancelar = async (id: number) => {
		try {
			setCancelandoId(id);
			await cancelarReserva(id);
			await cargar();
		} catch (e) {
			alert((e as any)?.response?.data?.mensaje || 'No se pudo cancelar la reserva');
		} finally {
			setCancelandoId(null);
		}
	};

	if (cargando) return <PageLoader message="Cargando mis reservas..." />;

	return (
		<div className="reservas-page">
			<div className="reservas-card">
				<div className="reservas-card-header">
					<h2>Mis Reservas</h2>
				</div>
				<div className="reservas-card-body">
					{/* Solo mostrar error si hay un error real, no cuando simplemente no hay reservas */}
					{error && (
						<div className="reservas-alert-error">
							{error}
						</div>
					)}
					{!error && reservas.length === 0 && (
						<div className="reservas-no-results">
							<BookOpen className="reservas-no-results-icon" />
							<h3>No tienes reservas</h3>
							<p className="reservas-no-results-text">Cuando hagas una reserva, aparecerá aquí.</p>
						</div>
					)}
					{!error && reservas.length > 0 && (
						<table className="reservas-table">
							<thead>
								<tr>
									<th>Reserva</th>
									<th>Libro</th>
									<th>Fecha</th>
									<th>Estado</th>
									<th>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{reservas.map(r => (
									<tr key={r.reservaID}>
										<td>#{r.reservaID}</td>
									<td>
										<strong>{r.libroTitulo}</strong>
										<div className="small text-muted">ISBN: {r.libroISBN || 'N/D'}</div>
									</td>
									<td>
										<span className="reservas-fecha">
											<Calendar className="reservas-icon" />{new Date(r.fechaReserva).toLocaleString()}
										</span>
									</td>
									<td>
										<span className={`reservas-estado-badge reservas-estado-${r.estado?.toLowerCase() || 'default'}`}>
											{r.estado}
										</span>
									</td>
									<td>
										<button
											className="reservas-btn-cancelar"
												disabled={cancelandoId === r.reservaID || r.estado !== 'Activa'}
												onClick={() => onCancelar(r.reservaID)}
												title="Cancelar reserva"
											>
												{cancelandoId === r.reservaID ? 'Cancelando...' : (<><X className="reservas-icon" /> Cancelar</>)}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
};

export default MyReservations;
