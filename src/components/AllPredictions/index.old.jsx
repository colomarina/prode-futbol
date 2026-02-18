// import { useRounds } from '../../hooks/useRounds'
// import { useState, useEffect, useCallback, useMemo } from 'react'
// import { useMatches } from '../../hooks/useMatches'
// import { supabase } from '../../lib/supabase'
// import TeamDisplay from '../TeamDisplay'

// export default function AllPredictions({ initialRound = null, initialUser = '' }) {
//   const { rounds, loading: roundsLoading } = useRounds()
//   const [selectedRound, setSelectedRound] = useState(null)
//   const { matches, loading: matchesLoading } = useMatches(selectedRound)
//   const [roundPredictions, setRoundPredictions] = useState({})
//   const [matchPredictions, setMatchPredictions] = useState({})
//   const [users, setUsers] = useState([])
//   const [selectedUser, setSelectedUser] = useState('')
//   const [selectedMatchId, setSelectedMatchId] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [matchLoading, setMatchLoading] = useState(false)
//   const [viewMode, setViewMode] = useState('by-user')

//   useEffect(() => {
//     if (initialRound) {
//       setSelectedRound(initialRound)
//     }
//   }, [initialRound])

//   useEffect(() => {
//     if (initialUser) {
//       setSelectedUser(initialUser)
//     }
//   }, [initialUser])

//   useEffect(() => {
//     setSelectedMatchId(null)
//     setMatchPredictions({})
//   }, [selectedRound])

//   useEffect(() => {
//     if (viewMode === 'by-user') {
//       setSelectedMatchId(null)
//       setMatchPredictions({})
//     } else {
//       setSelectedUser('')
//       setRoundPredictions({})
//     }
//   }, [viewMode])

//   // Cargar usuarios
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('profiles')
//           .select('id, username, full_name')
//           .order('full_name')

//         if (error) throw error
//         setUsers(data || [])
//       } catch {
//         // TODO: manejar error de forma más elegante, quizás con un toast específico para esta sección
//         // console.error('Error cargando usuarios:', error)
//       }
//     }

//     fetchUsers()
//   }, [])

//   // Obtener el round actual seleccionado
//   const currentRound = useMemo(
//     () => rounds.find(r => r.round_number === selectedRound),
//     [rounds, selectedRound]
//   )

//   const isRoundOpen = currentRound?.status === 'open'

//   // Filtrar fechas disponibles para ver
//   const availableRounds = useMemo(
//     () => rounds.filter(r => ['locked', 'finished'].includes(r.status)),
//     [rounds]
//   )

//   // Usuario seleccionado memoizado
//   const selectedUserData = useMemo(
//     () => users.find(u => u.id === selectedUser),
//     [users, selectedUser]
//   )

//   const selectedMatch = useMemo(
//     () => matches.find(match => match.id === selectedMatchId),
//     [matches, selectedMatchId]
//   )

//   const fetchPredictionsForRound = useCallback(async () => {
//     if (!selectedRound || !selectedUser || !matches.length) return

//     setLoading(true)
//     try {
//       const matchIds = matches.map(m => m.id)

//       const { data, error } = await supabase
//         .from('predictions')
//         .select('*')
//         .in('match_id', matchIds)
//         .eq('user_id', selectedUser)

//       if (error) throw error

//       // Organizar predicciones por match_id
//       const predictionsByMatch = {}
//       data?.forEach(pred => {
//         predictionsByMatch[pred.match_id] = pred
//       })

//       setRoundPredictions(predictionsByMatch)
//     } catch {
//       // TODO: manejar error de forma más elegante, quizás con un toast específico para esta sección
//       // console.error('Error cargando pronósticos:', error)
//       setRoundPredictions({})
//     } finally {
//       setLoading(false)
//     }
//   }, [selectedRound, selectedUser, matches])

//   const fetchPredictionsForMatch = useCallback(async () => {
//     console.log('Cargando predicciones para el partido:', selectedMatchId)
//     if (!selectedMatchId) return

//     setMatchLoading(true)
//     try {
//       const { data, error } = await supabase
//         .from('predictions')
//         .select('*')
//         .eq('match_id', selectedMatchId)

//       console.log('Predicciones del partido:', data)

//       if (error) throw error

//       const predictionsByUser = {}
//       data?.forEach(pred => {
//         predictionsByUser[pred.user_id] = pred
//       })

//       setMatchPredictions(predictionsByUser)
//     } catch {
//       // TODO: manejar error de forma más elegante, quizás con un toast específico para esta sección
//       // console.error('Error cargando pronósticos del partido:', error)
//       setMatchPredictions({})
//     } finally {
//       setMatchLoading(false)
//     }
//   }, [selectedMatchId])

//   // Cargar predicciones cuando se seleccionan fecha Y usuario (y la fecha NO está abierta)
//   useEffect(() => {
//     if (viewMode !== 'by-user') return

//     if (selectedRound && selectedUser && !isRoundOpen) {
//       fetchPredictionsForRound()
//     } else {
//       setRoundPredictions({})
//     }
//   }, [viewMode, selectedRound, selectedUser, isRoundOpen, fetchPredictionsForRound])

//   useEffect(() => {
//     if (viewMode !== 'by-match') return

//     console.log(
//       'Selección cambió - Round:',
//       selectedRound,
//       'Match ID:',
//       selectedMatchId,
//       'Round Open:',
//       isRoundOpen
//     )
//     if (selectedRound && selectedMatchId && !isRoundOpen) {
//       console.log('Cargando predicciones para el partido seleccionado:', selectedMatchId)
//       fetchPredictionsForMatch()
//     } else {
//       setMatchPredictions({})
//     }
//   }, [viewMode, selectedRound, selectedMatchId, isRoundOpen, fetchPredictionsForMatch])

//   // Verificar si el partido ya empezó
//   const hasMatchStarted = useCallback(match => {
//     return new Date() >= new Date(match.match_date)
//   }, [])

//   if (roundsLoading) {
//     return (
//       <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
//         <div className="spinner" style={{ margin: '0 auto 16px' }} />
//         <p style={{ color: 'var(--color-text-secondary)' }}>Cargando...</p>
//       </div>
//     )
//   }

//   return (
//     <div className="container" style={{ maxWidth: '1000px' }}>
//       {/* Header */}
//       <div style={{ marginBottom: '12px', textAlign: 'center' }}>
//         <h2
//           style={{
//             fontSize: '1.1rem',
//             fontWeight: '700',
//             color: 'var(--color-primary)',
//             marginBottom: '8px',
//           }}
//         >
//           👥 Espia como vienen los rivales
//         </h2>
//       </div>

//       {/* Mensaje cuando no hay fechas disponibles */}
//       {availableRounds.length === 0 && (
//         <div style={{ textAlign: 'center', padding: '48px 16px' }}>
//           <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
//           <h3
//             style={{
//               color: 'var(--color-text-primary)',
//               marginBottom: '12px',
//               fontSize: '1.5rem',
//               fontWeight: '700',
//             }}
//           >
//             Todavía no hay fechas para ver
//           </h3>
//           <p
//             style={{
//               color: 'var(--color-text-secondary)',
//               fontSize: '1rem',
//               lineHeight: 1.6,
//               maxWidth: '500px',
//               margin: '0 auto',
//             }}
//           >
//             Los pronósticos de otros usuarios se podrán ver cuando las fechas estén bloqueadas o
//             finalizadas. Por ahora, todas las fechas están abiertas o pendientes.
//           </p>
//         </div>
//       )}

//       {/* Selectores de fecha y usuario */}
//       {availableRounds.length > 0 && (
//         <div className="card" style={{ marginBottom: '8px' }}>
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'center',
//               marginBottom: '16px',
//             }}
//           >
//             <div
//               style={{
//                 display: 'inline-flex',
//                 backgroundColor: '#f5f5f5',
//                 borderRadius: '999px',
//                 padding: '3px',
//                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
//                 border: 'none',
//                 gap: '2px',
//               }}
//             >
//               <button
//                 type="button"
//                 onClick={() => setViewMode('by-user')}
//                 style={{
//                   padding: '10px 18px',
//                   borderRadius: '999px',
//                   border: 'none',
//                   backgroundColor: viewMode === 'by-user' ? 'var(--color-primary)' : 'transparent',
//                   color: viewMode === 'by-user' ? 'white' : 'var(--color-text-primary)',
//                   fontWeight: '600',
//                   cursor: 'pointer',
//                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//                   boxShadow: viewMode === 'by-user' ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
//                   fontSize: '0.95rem',
//                 }}
//               >
//                 👤 Por usuario
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setViewMode('by-match')}
//                 style={{
//                   padding: '10px 18px',
//                   borderRadius: '999px',
//                   border: 'none',
//                   backgroundColor: viewMode === 'by-match' ? 'var(--color-primary)' : 'transparent',
//                   color: viewMode === 'by-match' ? 'white' : 'var(--color-text-primary)',
//                   fontWeight: '600',
//                   cursor: 'pointer',
//                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//                   boxShadow: viewMode === 'by-match' ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
//                   fontSize: '0.95rem',
//                 }}
//               >
//                 ⚽ Por partido
//               </button>
//             </div>
//           </div>

//           <div
//             style={{
//               display: 'grid',
//               gridTemplateColumns: '1fr',
//               gap: '16px',
//             }}
//             className="responsive-selectors"
//           >
//             <div style={{ width: '100%' }}>
//               <label className="form-label">📅 Seleccioná una Fecha</label>
//               <select
//                 value={selectedRound || ''}
//                 onChange={e => {
//                   const value = e.target.value
//                   setSelectedRound(value ? Number(value) : null)
//                 }}
//                 className="form-input"
//                 style={{
//                   width: '100%',
//                   padding: '14px 16px',
//                   fontSize: '1rem',
//                   borderRadius: '10px',
//                   border: '2px solid var(--color-primary)',
//                   cursor: 'pointer',
//                 }}
//               >
//                 <option value="">Seleccionar fecha...</option>
//                 {availableRounds.map(round => (
//                   <option key={round.id} value={round.round_number}>
//                     Fecha {round.round_number}{' '}
//                     {round.status === 'finished' ? '(Finalizada 🏁)' : '(En juego ⚽)'}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {viewMode === 'by-user' ? (
//               <div style={{ width: '100%' }}>
//                 <label className="form-label">👤 Seleccionar Usuario</label>
//                 <select
//                   value={selectedUser}
//                   onChange={e => setSelectedUser(e.target.value)}
//                   className="form-input"
//                   style={{
//                     width: '100%',
//                     padding: '14px 16px',
//                     fontSize: '1rem',
//                     borderRadius: '10px',
//                     border: '2px solid var(--color-primary)',
//                     cursor: 'pointer',
//                   }}
//                 >
//                   <option value="">Seleccionar usuario...</option>
//                   {users.map(user => (
//                     <option key={user.id} value={user.id}>
//                       {user.full_name} (@{user.username})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             ) : (
//               <div style={{ width: '100%' }}>
//                 <label className="form-label">⚽ Seleccionar Partido</label>
//                 <select
//                   value={selectedMatchId || ''}
//                   onChange={e => {
//                     const value = e.target.value
//                     setSelectedMatchId(value ? value : null)
//                   }}
//                   className="form-input"
//                   style={{
//                     width: '100%',
//                     padding: '14px 16px',
//                     fontSize: '1rem',
//                     borderRadius: '10px',
//                     border: '2px solid var(--color-primary)',
//                     cursor: 'pointer',
//                   }}
//                   disabled={!selectedRound || matchesLoading || matches.length === 0}
//                 >
//                   <option value="">Seleccionar partido...</option>
//                   {matches.map(match => (
//                     <option key={match.id} value={match.id}>
//                       Partido #{match.match_number} - {match.home_team?.name || 'Local'} vs{' '}
//                       {match.away_team?.name || 'Visitante'}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//           </div>

//           <style>{`
//           @media (min-width: 768px) {
//             .responsive-selectors {
//               grid-template-columns: 1fr 1fr !important;
//             }
//           }
//         `}</style>
//         </div>
//       )}

//       {/* Lista de partidos con pronósticos */}
//       {viewMode === 'by-user' &&
//         availableRounds.length > 0 &&
//         selectedRound &&
//         selectedUser &&
//         !matchesLoading &&
//         matches.length > 0 &&
//         !isRoundOpen && (
//           <div>
//             <h3
//               style={{
//                 fontSize: '1.25rem',
//                 fontWeight: '700',
//                 marginBottom: '16px',
//                 color: 'var(--color-text-primary)',
//                 textAlign: 'center',
//               }}
//             >
//               Pronósticos de {selectedUserData?.full_name || 'Usuario'} - Fecha {selectedRound}
//             </h3>

//             {loading ? (
//               <div style={{ textAlign: 'center', padding: '40px' }}>
//                 <div className="spinner" style={{ margin: '0 auto 16px' }} />
//                 <p style={{ color: 'var(--color-text-secondary)' }}>Cargando pronósticos...</p>
//               </div>
//             ) : (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                 {matches.map(match => {
//                   const started = hasMatchStarted(match)
//                   const prediction = roundPredictions[match.id]

//                   return (
//                     <div
//                       key={match.id}
//                       className="card"
//                       style={{
//                         padding: '12px',
//                         opacity: started ? 1 : 0.6,
//                         background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
//                         border: '1px solid #e2e8f0',
//                         borderRadius: '16px',
//                         boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
//                       }}
//                     >
//                       {/* Header: Número y estado */}
//                       <div
//                         style={{
//                           display: 'flex',
//                           justifyContent: 'space-between',
//                           alignItems: 'center',
//                           marginBottom: '12px',
//                           paddingBottom: '8px',
//                           borderBottom: '1px solid #f0f0f0',
//                         }}
//                       >
//                         <span
//                           style={{
//                             backgroundColor: 'var(--color-primary)',
//                             color: 'white',
//                             padding: '4px 10px',
//                             borderRadius: '8px',
//                             fontSize: '0.75rem',
//                             fontWeight: '700',
//                           }}
//                         >
//                           Partido #{match.match_number}
//                         </span>

//                         {!started ? (
//                           <span
//                             style={{
//                               backgroundColor: '#ef4444',
//                               color: 'white',
//                               padding: '4px 10px',
//                               borderRadius: '8px',
//                               fontSize: '0.7rem',
//                               fontWeight: '600',
//                             }}
//                           >
//                             🔒 No empezó
//                           </span>
//                         ) : match.is_finished ? (
//                           <span
//                             style={{
//                               backgroundColor: 'var(--color-success)',
//                               color: 'white',
//                               padding: '4px 10px',
//                               borderRadius: '8px',
//                               fontSize: '0.7rem',
//                               fontWeight: '600',
//                             }}
//                           >
//                             ✓ Finalizado
//                           </span>
//                         ) : (
//                           <span
//                             style={{
//                               backgroundColor: '#f59e0b',
//                               color: 'white',
//                               padding: '4px 10px',
//                               borderRadius: '8px',
//                               fontSize: '0.7rem',
//                               fontWeight: '600',
//                             }}
//                           >
//                             ⚽ En juego
//                           </span>
//                         )}
//                       </div>

//                       {/* Partido y pronóstico */}
//                       <div
//                         style={{
//                           display: 'grid',
//                           gridTemplateColumns: '1fr auto 1fr',
//                           gap: '12px',
//                           alignItems: 'center',
//                         }}
//                       >
//                         {/* Equipo Local */}
//                         <div style={{ justifySelf: 'end', textAlign: 'center' }}>
//                           <TeamDisplay team={match.home_team} size="sm" showNameBelow />
//                         </div>

//                         {/* Pronóstico del usuario */}
//                         <div style={{ textAlign: 'center', minWidth: '80px' }}>
//                           {prediction ? (
//                             <div>
//                               <div
//                                 style={{
//                                   fontSize: '0.7rem',
//                                   color: 'var(--color-text-secondary)',
//                                   marginBottom: '2px',
//                                 }}
//                               >
//                                 Pronóstico
//                               </div>
//                               <div
//                                 style={{
//                                   fontSize: '1.4rem',
//                                   fontWeight: '700',
//                                   color: 'var(--color-primary)',
//                                 }}
//                               >
//                                 {prediction.home_prediction} - {prediction.away_prediction}
//                               </div>

//                               {match.is_finished && (
//                                 <div style={{ marginTop: '8px' }}>
//                                   <div
//                                     style={{
//                                       fontSize: '0.65rem',
//                                       color: 'var(--color-text-secondary)',
//                                       marginBottom: '2px',
//                                     }}
//                                   >
//                                     Resultado Real
//                                   </div>
//                                   <div
//                                     style={{
//                                       fontSize: '0.9rem',
//                                       fontWeight: '600',
//                                       color: '#64748b',
//                                     }}
//                                   >
//                                     {match.home_score} - {match.away_score}
//                                   </div>
//                                   <div
//                                     style={{
//                                       marginTop: '4px',
//                                       fontSize: '0.85rem',
//                                       fontWeight: '600',
//                                       color: prediction.points > 0 ? '#10b981' : '#ef4444',
//                                     }}
//                                   >
//                                     {prediction.points > 0 ? '✅' : '❌'} {prediction.points} pts
//                                   </div>
//                                 </div>
//                               )}
//                             </div>
//                           ) : (
//                             <div
//                               style={{
//                                 fontSize: '0.85rem',
//                                 color: 'var(--color-text-secondary)',
//                                 fontStyle: 'italic',
//                               }}
//                             >
//                               Sin pronóstico
//                             </div>
//                           )}
//                         </div>

//                         {/* Equipo Visitante */}
//                         <div style={{ justifySelf: 'start', textAlign: 'center' }}>
//                           <TeamDisplay team={match.away_team} size="sm" showNameBelow />
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>
//         )}

//       {viewMode === 'by-match' &&
//         availableRounds.length > 0 &&
//         selectedRound &&
//         selectedMatchId &&
//         !matchesLoading &&
//         matches.length > 0 &&
//         !isRoundOpen && (
//           <div>
//             <h3
//               style={{
//                 fontSize: '1.25rem',
//                 fontWeight: '700',
//                 marginBottom: '16px',
//                 color: 'var(--color-text-primary)',
//                 textAlign: 'center',
//               }}
//             >
//               Pronósticos del Partido #{selectedMatch?.match_number || ''} - Fecha {selectedRound}
//             </h3>

//             {selectedMatch && (
//               <div
//                 className="card"
//                 style={{
//                   padding: '16px',
//                   marginBottom: '16px',
//                   background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
//                   border: '1px solid #e2e8f0',
//                   borderRadius: '16px',
//                   boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
//                 }}
//               >
//                 {/* Header: Número y estado */}
//                 <div
//                   style={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     marginBottom: '12px',
//                     paddingBottom: '8px',
//                     borderBottom: '1px solid #f0f0f0',
//                   }}
//                 >
//                   <span
//                     style={{
//                       backgroundColor: 'var(--color-primary)',
//                       color: 'white',
//                       padding: '4px 10px',
//                       borderRadius: '8px',
//                       fontSize: '0.75rem',
//                       fontWeight: '700',
//                     }}
//                   >
//                     Partido #{selectedMatch.match_number}
//                   </span>

//                   {new Date() < new Date(selectedMatch.match_date) ? (
//                     <span
//                       style={{
//                         backgroundColor: '#ef4444',
//                         color: 'white',
//                         padding: '4px 10px',
//                         borderRadius: '8px',
//                         fontSize: '0.7rem',
//                         fontWeight: '600',
//                       }}
//                     >
//                       🔒 No empezó
//                     </span>
//                   ) : selectedMatch.is_finished ? (
//                     <span
//                       style={{
//                         backgroundColor: 'var(--color-success)',
//                         color: 'white',
//                         padding: '4px 10px',
//                         borderRadius: '8px',
//                         fontSize: '0.7rem',
//                         fontWeight: '600',
//                       }}
//                     >
//                       ✓ Finalizado
//                     </span>
//                   ) : (
//                     <span
//                       style={{
//                         backgroundColor: '#f59e0b',
//                         color: 'white',
//                         padding: '4px 10px',
//                         borderRadius: '8px',
//                         fontSize: '0.7rem',
//                         fontWeight: '600',
//                       }}
//                     >
//                       ⚽ En juego
//                     </span>
//                   )}
//                 </div>

//                 {/* Partido y resultado */}
//                 <div
//                   style={{
//                     display: 'grid',
//                     gridTemplateColumns: '1fr auto 1fr',
//                     gap: '12px',
//                     alignItems: 'center',
//                   }}
//                 >
//                   {/* Equipo Local */}
//                   <div style={{ justifySelf: 'end', textAlign: 'center' }}>
//                     <TeamDisplay team={selectedMatch.home_team} size="sm" showNameBelow />
//                   </div>

//                   {/* Resultado Real */}
//                   <div style={{ textAlign: 'center', minWidth: '80px' }}>
//                     <div
//                       style={{
//                         fontSize: '0.7rem',
//                         color: 'var(--color-text-secondary)',
//                         marginBottom: '2px',
//                       }}
//                     >
//                       Resultado Real
//                     </div>
//                     <div
//                       style={{
//                         fontSize: '1.4rem',
//                         fontWeight: '700',
//                         color: 'var(--color-primary)',
//                       }}
//                     >
//                       {selectedMatch.is_finished
//                         ? `${selectedMatch.home_score ?? '-'} - ${selectedMatch.away_score ?? '-'}`
//                         : 'En juego'}
//                     </div>
//                   </div>

//                   {/* Equipo Visitante */}
//                   <div style={{ justifySelf: 'start', textAlign: 'center' }}>
//                     <TeamDisplay team={selectedMatch.away_team} size="sm" showNameBelow />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {matchLoading ? (
//               <div style={{ textAlign: 'center', padding: '40px' }}>
//                 <div className="spinner" style={{ margin: '0 auto 16px' }} />
//                 <p style={{ color: 'var(--color-text-secondary)' }}>Cargando pronósticos...</p>
//               </div>
//             ) : (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                 {users.map(user => {
//                   const prediction = matchPredictions[user.id]

//                   return (
//                     <div
//                       key={user.id}
//                       className="card match-prediction-row"
//                       style={{
//                         padding: '10px 12px',
//                         background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
//                         border: '1px solid #e2e8f0',
//                         borderRadius: '12px',
//                         boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         gap: '10px',
//                         flexWrap: 'nowrap',
//                       }}
//                     >
//                       <div className="match-prediction-user">
//                         <div
//                           style={{
//                             fontSize: '0.9rem',
//                             fontWeight: '700',
//                             color: 'var(--color-text-primary)',
//                           }}
//                         >
//                           {user.username}
//                         </div>
//                         <div
//                           style={{
//                             fontSize: '0.8rem',
//                             color: 'var(--color-text-secondary)',
//                           }}
//                         >
//                           @{user.full_name}
//                         </div>
//                       </div>

//                       <div className="match-prediction-score" style={{ textAlign: 'center' }}>
//                         {prediction ? (
//                           <div>
//                             <div
//                               style={{
//                                 fontSize: '0.7rem',
//                                 color: 'var(--color-text-secondary)',
//                                 marginBottom: '2px',
//                               }}
//                             >
//                               Pronóstico
//                             </div>
//                             <div
//                               style={{
//                                 fontSize: '1.2rem',
//                                 fontWeight: '700',
//                                 color: 'var(--color-primary)',
//                               }}
//                             >
//                               {prediction.home_prediction} - {prediction.away_prediction}
//                             </div>
//                             {selectedMatch?.is_finished && (
//                               <div
//                                 style={{
//                                   marginTop: '4px',
//                                   fontSize: '0.85rem',
//                                   fontWeight: '600',
//                                   color: prediction.points > 0 ? '#10b981' : '#ef4444',
//                                 }}
//                               >
//                                 {prediction.points > 0 ? '✅' : '❌'} {prediction.points} pts
//                               </div>
//                             )}
//                           </div>
//                         ) : (
//                           <div
//                             style={{
//                               fontSize: '0.85rem',
//                               color: 'var(--color-text-secondary)',
//                               fontStyle: 'italic',
//                             }}
//                           >
//                             Sin pronóstico
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>
//         )}

//       <style>{`
//         @media (max-width: 767px) {
//           .match-prediction-row {
//             padding: 8px 10px !important;
//             display: grid !important;
//             grid-template-columns: 1fr auto !important;
//             align-items: center !important;
//             gap: 8px !important;
//           }

//           .match-prediction-user {
//             min-width: 0;
//           }

//           .match-prediction-score {
//             min-width: 80px;
//           }
//         }
//       `}</style>

//       {/* Mensaje cuando no hay partidos en la fecha */}
//       {availableRounds.length > 0 &&
//         selectedRound &&
//         !matchesLoading &&
//         matches.length === 0 &&
//         !isRoundOpen && (
//           <div style={{ textAlign: 'center', padding: '0px 16px' }}>
//             <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
//             <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
//               No hay partidos cargados
//             </h3>
//             <p style={{ color: 'var(--color-text-secondary)' }}>
//               Esta fecha todavía no tiene partidos configurados
//             </p>
//           </div>
//         )}

//       {/* Mensaje cuando la fecha está abierta */}
//       {availableRounds.length > 0 &&
//         selectedRound &&
//         ((viewMode === 'by-user' && selectedUser) ||
//           (viewMode === 'by-match' && selectedMatchId)) &&
//         isRoundOpen && (
//           <div style={{ textAlign: 'center', padding: '8px 16px' }}>
//             <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
//             <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
//               Fecha abierta
//             </h3>
//             <p style={{ color: 'var(--color-text-secondary)' }}>
//               Los pronósticos se pueden ver una vez que la fecha esté cerrada
//             </p>
//           </div>
//         )}

//       {/* Mensaje cuando no hay selección */}
//       {availableRounds.length > 0 &&
//         (!selectedRound ||
//           (viewMode === 'by-user' && !selectedUser) ||
//           (viewMode === 'by-match' && !selectedMatchId)) && (
//           <div style={{ textAlign: 'center', padding: '48px 16px' }}>
//             <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
//             <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
//               {viewMode === 'by-match'
//                 ? 'Seleccioná una fecha y un partido'
//                 : 'Seleccioná una fecha y un usuario'}
//             </h3>
//             <p style={{ color: 'var(--color-text-secondary)' }}>
//               {viewMode === 'by-match'
//                 ? 'Elegí una fecha y un partido para ver todos los pronósticos'
//                 : 'Elegí una fecha y un usuario para ver sus pronósticos'}
//             </p>
//           </div>
//         )}
//     </div>
//   )
// }
