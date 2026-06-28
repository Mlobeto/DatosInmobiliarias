import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

function App() {
  const [inmobiliarias, setInmobiliarias] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [ciudades, setCiudades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtros
  const [filtros, setFiltros] = useState({
    ciudad: '',
    estado: '',
    busqueda: ''
  })

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [inmobiliariaSeleccionada, setInmobiliariaSeleccionada] = useState(null)
  const [nuevaNota, setNuevaNota] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [buscandoTelefono, setBuscandoTelefono] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [datosEditables, setDatosEditables] = useState({
    telefono: '',
    sitioWeb: '',
    direccion: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [filtros])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [resInmobiliarias, resEstadisticas, resCiudades] = await Promise.all([
        axios.get(`${API_URL}/inmobiliarias`, { params: filtros }),
        axios.get(`${API_URL}/estadisticas`),
        axios.get(`${API_URL}/ciudades`)
      ])

      setInmobiliarias(resInmobiliarias.data)
      setEstadisticas(resEstadisticas.data)
      setCiudades(resCiudades.data)
      setError(null)
    } catch (err) {
      setError('Error al cargar los datos. Asegúrate de que el servidor esté corriendo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (inmobiliaria) => {
    setInmobiliariaSeleccionada(inmobiliaria)
    setNuevoEstado(inmobiliaria.estado || 'nuevo')
    setDatosEditables({
      telefono: inmobiliaria.telefono || '',
      sitioWeb: inmobiliaria.sitioWeb || '',
      direccion: inmobiliaria.direccion || ''
    })
    setModoEdicion(false)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setInmobiliariaSeleccionada(null)
    setNuevaNota('')
    setNuevoEstado('')
    setModoEdicion(false)
  }

  const actualizarEstado = async (id, estado) => {
    try {
      await axios.put(`${API_URL}/inmobiliarias/${id}`, { estado })
      cargarDatos()
      if (modalAbierto) cerrarModal()
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el estado')
    }
  }

  const agregarNota = async () => {
    if (!nuevaNota.trim()) return

    try {
      await axios.post(`${API_URL}/inmobiliarias/${inmobiliariaSeleccionada.id}/notas`, {
        texto: nuevaNota
      })
      setNuevaNota('')
      
      // Recargar la inmobiliaria actualizada
      const res = await axios.get(`${API_URL}/inmobiliarias/${inmobiliariaSeleccionada.id}`)
      setInmobiliariaSeleccionada(res.data)
      cargarDatos()
    } catch (err) {
      console.error(err)
      alert('Error al agregar nota')
    }
  }

  const guardarCambios = async () => {
    try {
      const datosActualizar = {
        estado: nuevoEstado,
        ...(modoEdicion && {
          telefono: datosEditables.telefono,
          sitioWeb: datosEditables.sitioWeb,
          direccion: datosEditables.direccion
        })
      }

      await axios.put(`${API_URL}/inmobiliarias/${inmobiliariaSeleccionada.id}`, datosActualizar)
      cargarDatos()
      cerrarModal()
    } catch (err) {
      console.error(err)
      alert('Error al guardar cambios')
    }
  }

  const resetearFiltros = () => {
    setFiltros({ ciudad: '', estado: '', busqueda: '' })
  }

  const getEstadoLabel = (estado) => {
    const labels = {
      nuevo: 'Nuevo',
      contactado: 'Contactado',
      interesado: 'Interesado',
      noInteresado: 'No Interesado',
      cliente: 'Cliente'
    }
    return labels[estado] || 'Nuevo'
  }

  const buscarTelefono = async (id) => {
    if (buscandoTelefono === id) return

    try {
      setBuscandoTelefono(id)
      const res = await axios.post(`${API_URL}/inmobiliarias/${id}/buscar-telefono`)
      
      if (res.data.success) {
        alert(`✅ Teléfono encontrado: ${res.data.telefono}`)
        cargarDatos()
      } else {
        alert('❌ No se encontró teléfono en la web')
      }
    } catch (err) {
      console.error(err)
      alert('Error al buscar teléfono. Asegúrate de que el backend esté corriendo.')
    } finally {
      setBuscandoTelefono(null)
    }
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>⚠️ {error}</h2>
          <p>Ejecuta: cd backend && npm install && npm start</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🏢 CRM Inmobiliarias Argentina</h1>
        <p>Gestión de leads para tu SaaS</p>
      </header>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="stats">
          <div className="stat-card">
            <div className="stat-value">{estadisticas.total}</div>
            <div className="stat-label">Total Inmobiliarias</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.porEstado.nuevo}</div>
            <div className="stat-label">Nuevos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.porEstado.contactado}</div>
            <div className="stat-label">Contactados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.porEstado.interesado}</div>
            <div className="stat-label">Interesados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.porEstado.cliente}</div>
            <div className="stat-label">Clientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.porcentajeTelefono}%</div>
            <div className="stat-label">Con Teléfono</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nombre o dirección..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
            />
          </div>
          <div className="filter-group">
            <label>Ciudad</label>
            <select 
              value={filtros.ciudad}
              onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Estado</label>
            <select 
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            >
              <option value="">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="contactado">Contactado</option>
              <option value="interesado">Interesado</option>
              <option value="noInteresado">No Interesado</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          <button className="btn-reset" onClick={resetearFiltros}>
            Resetear Filtros
          </button>
        </div>
      </div>

      {/* Lista de inmobiliarias */}
      <div className="inmobiliarias-list">
        <div className="list-header">
          <h2>Resultados ({inmobiliarias.length})</h2>
        </div>

        {loading ? (
          <div className="loading">Cargando...</div>
        ) : inmobiliarias.length === 0 ? (
          <div className="empty-state">
            <h3>No se encontraron inmobiliarias</h3>
            <p>Prueba ajustando los filtros o importa datos desde el backend</p>
          </div>
        ) : (
          inmobiliarias.map((inmobiliaria) => (
            <div
              key={inmobiliaria.id} 
              className={`inmobiliaria-card estado-${inmobiliaria.estado || 'nuevo'}`}
            >
              <div className="card-header">
                <div className="card-title">
                  <h3>{inmobiliaria.nombre}</h3>
                  <div className="card-ciudad">📍 {inmobiliaria.ciudad}</div>
                </div>
                <span className={`card-estado estado-${inmobiliaria.estado || 'nuevo'}`}>
                  {getEstadoLabel(inmobiliaria.estado)}
                </span>
              </div>

              <div className="card-info">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  {inmobiliaria.direccion || 'Sin dirección'}
                </div>
                <div className="info-item">
                  <span className="info-icon">📞</span>
                  {inmobiliaria.telefono && inmobiliaria.telefono !== 'No disponible' ? (
                    <span>
                      {inmobiliaria.telefono}
                      {inmobiliaria.telefonoEnriquecido && <span style={{color: '#4caf50', marginLeft: '0.5rem'}}>✨</span>}
                    </span>
                  ) : (
                    <span style={{color: '#999'}}>Sin teléfono</span>
                  )}
                </div>
                {inmobiliaria.sitioWeb && inmobiliaria.sitioWeb !== 'No disponible' && (
                  <div className="info-item">
                    <span className="info-icon">🌐</span>
                    <a href={inmobiliaria.sitioWeb} target="_blank" rel="noopener noreferrer">
                      Ver sitio web
                    </a>
                  </div>
                )}
                {inmobiliaria.rating && (
                  <div className="info-item">
                    <span className="info-icon">⭐</span>
                    {inmobiliaria.rating}
                  </div>
                )}
              </div>

              <div className="card-actions">
                {(!inmobiliaria.telefono || inmobiliaria.telefono === 'No disponible') && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => buscarTelefono(inmobiliaria.id)}
                    disabled={buscandoTelefono === inmobiliaria.id}
                    style={{
                      background: buscandoTelefono === inmobiliaria.id ? '#ccc' : '#ff9800',
                      color: 'white'
                    }}
                  >
                    {buscandoTelefono === inmobiliaria.id ? '🔍 Buscando...' : '🔍 Buscar Teléfono'}
                  </button>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={() => abrirModal(inmobiliaria)}
                >
                  Ver Detalles
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => actualizarEstado(inmobiliaria.id, 'contactado')}
                >
                  Marcar Contactado
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => actualizarEstado(inmobiliaria.id, 'interesado')}
                >
                  Interesado
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => actualizarEstado(inmobiliaria.id, 'noInteresado')}
                >
                  No Interesado
                </button>
              </div>
            </div>
            ))
          )}
        </div>
  
        {/* Modal de detalles */}
        {modalAbierto && inmobiliariaSeleccionada && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h2 style={{margin: 0}}>{inmobiliariaSeleccionada.nombre}</h2>
              <button 
                className={`btn ${modoEdicion ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setModoEdicion(!modoEdicion)}
                style={{fontSize: '0.9rem'}}
              >
                {modoEdicion ? '❌ Cancelar Edición' : '✏️ Editar Datos'}
              </button>
            </div>

            {modoEdicion ? (
              <>
                <div className="form-group">
                  <label>📞 Teléfono</label>
                  <input
                    type="text"
                    value={datosEditables.telefono}
                    onChange={(e) => setDatosEditables({...datosEditables, telefono: e.target.value})}
                    placeholder="Ej: +54 11 1234-5678"
                  />
                </div>

                <div className="form-group">
                  <label>🌐 Sitio Web</label>
                  <input
                    type="text"
                    value={datosEditables.sitioWeb}
                    onChange={(e) => setDatosEditables({...datosEditables, sitioWeb: e.target.value})}
                    placeholder="Ej: https://www.inmobiliaria.com"
                  />
                </div>

                <div className="form-group">
                  <label>📍 Dirección</label>
                  <input
                    type="text"
                    value={datosEditables.direccion}
                    onChange={(e) => setDatosEditables({...datosEditables, direccion: e.target.value})}
                    placeholder="Ej: Av. Principal 1234"
                  />
                </div>
              </>
            ) : (
              <div style={{marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px'}}>
                <div style={{marginBottom: '0.75rem'}}>
                  <strong>📍 Dirección:</strong> {inmobiliariaSeleccionada.direccion || 'No disponible'}
                </div>
                <div style={{marginBottom: '0.75rem'}}>
                  <strong>📞 Teléfono:</strong> {inmobiliariaSeleccionada.telefono || 'No disponible'}
                </div>
                <div style={{marginBottom: '0.75rem'}}>
                  <strong>🌐 Web:</strong>{' '}
                  {inmobiliariaSeleccionada.sitioWeb && inmobiliariaSeleccionada.sitioWeb !== 'No disponible' ? (
                    <a href={inmobiliariaSeleccionada.sitioWeb} target="_blank" rel="noopener noreferrer">
                      {inmobiliariaSeleccionada.sitioWeb}
                    </a>
                  ) : (
                    'No disponible'
                  )}
                </div>
                <div>
                  <strong>📊 Rating:</strong> {inmobiliariaSeleccionada.rating || 'N/A'}
                </div>
        </div>
      )}

      <div className="form-group">
              <label>Estado</label>
              <select 
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
              >
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="interesado">Interesado</option>
                <option value="noInteresado">No Interesado</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>

            <div className="form-group">
              <label>Agregar Nota</label>
              <textarea
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Escribe una nota sobre esta inmobiliaria..."
              />
              <button 
                className="btn btn-primary" 
                style={{marginTop: '0.5rem'}}
                onClick={agregarNota}
              >
                Agregar Nota
              </button>
            </div>

            {inmobiliariaSeleccionada.notas && inmobiliariaSeleccionada.notas.length > 0 && (
              <div className="form-group">
                <label>Notas Anteriores</label>
                <div className="notas-list">
                  {inmobiliariaSeleccionada.notas.map((nota) => (
                    <div key={nota.id} className="nota-item">
                      <div className="nota-fecha">
                        {new Date(nota.fecha).toLocaleString('es-AR')}
                      </div>
                      <div className="nota-texto">{nota.texto}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={cerrarModal}>
                Cerrar
              </button>
              <button className="btn btn-primary" onClick={guardarCambios}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
