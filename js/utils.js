import { DEBUG_MODE, MINUTES_PER_DAY } from './constants.js';
import { hideLoadingModal } from './ui.js';
import TimelineApi from '../controller/TimelineController.js';
import RondasApi from '../controller/rondasController.js';
import { showToast } from '../src/utils/feedback.js';
// Timeline state management functions
export function getCurrentTimelineKey() {
    return window.timelineManager.keys[window.timelineManager.currentIndex];
}

// Export to both module and window
export function getCurrentTimelineData() {
    const currentKey = getCurrentTimelineKey();
    return window.timelineManager.activities[currentKey] || [];
}

// Make getCurrentTimelineData available globally
window.getCurrentTimelineData = getCurrentTimelineData;

// UI Functions
function createTimeLabel(block, showImmediately = false) {
    // Check if we're in vertical mode by looking at window width
    const isVerticalMode = window.innerWidth <= 1440;

    if (isVerticalMode) {
        // Create activity text container
        const textContainer = document.createElement('div');
        textContainer.className = 'activity-text';
        textContainer.textContent = block.dataset.activityName;
        block.appendChild(textContainer);

        // Create time label (hidden by default in vertical mode unless showImmediately is true)
        const label = document.createElement('div');
        label.className = 'time-label';
        label.style.display = showImmediately ? 'block' : 'none';
        block.appendChild(label);

        return label;
    } else {
        // Horizontal mode - original implementation
        const label = document.createElement('div');
        label.className = 'time-label';
        label.style.position = 'absolute';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        label.style.color = '#fff';
        label.style.padding = '2px 4px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '10px';
        label.style.whiteSpace = 'nowrap';
        label.style.pointerEvents = 'none';
        label.style.zIndex = '10';

        label.style.bottom = '-20px';
        label.style.top = 'auto';

        block.appendChild(label);

        // Only look for labels within the active timeline
        const existingLabels = block.parentElement.querySelectorAll('.time-label');
        existingLabels.forEach(existingLabel => {
            if (existingLabel !== label && isOverlapping(existingLabel, label)) {
                label.style.bottom = 'auto';
                label.style.top = '-20px';
            }
        });

        return label;
    }
}

function updateTimeLabel(label, startTime, endTime) {
    if (!label || !label.parentElement) return;

    const parentBlock = label.parentElement;
    // Instead of using data-start and data-end directly (which lack the (+1) marker),
    // use data-start-minutes and data-end-minutes if available.
    const startMinutes = parentBlock.dataset.startMinutes
        ? parseInt(parentBlock.dataset.startMinutes, 10)
        : timeToMinutes(parentBlock.dataset.start);
    const endMinutes = parentBlock.dataset.endMinutes
        ? parseInt(parentBlock.dataset.endMinutes, 10)
        : timeToMinutes(parentBlock.dataset.end);

    // Get formatted times using formatTimeHHMM; for the end time, pass isEndTime=true.
    const formattedStartTime = formatTimeHHMM(startMinutes);
    const formattedEndTime = formatTimeHHMM(endMinutes, true);

    // Always remove the (+1) marker from the displayed label text.
    label.textContent = `${formattedStartTime.replace('(+1)', '')} - ${formattedEndTime.replace('(+1)', '')}`;

    // Position label based on layout
    if (window.innerWidth <= 1440) {
        label.style.display = 'block';
    } else {
        label.style.bottom = '-20px';
        label.style.top = 'auto';
        const existingLabels = label.parentElement.parentElement.querySelectorAll('.time-label');
        existingLabels.forEach(existingLabel => {
            if (existingLabel !== label && isOverlapping(existingLabel, label)) {
                label.style.bottom = 'auto';
                label.style.top = '-20px';
            }
        });
    }
}

export {
    createTimeLabel,
    updateTimeLabel
};

export function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

export function formatTimeDDMMYYYYHHMM(startTime, endTime) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Remove (+1) notation for date processing
    const startTimeOnly = startTime.replace('(+1)', '').trim();
    const endTimeOnly = endTime.replace('(+1)', '').trim();

    const [startHour, startMin] = startTimeOnly.split(':').map(Number);
    const [endHour, endMin] = endTimeOnly.split(':').map(Number);

    // Create base dates - everything starts on yesterday by default
    // since our timeline starts at 4:00 AM yesterday
    const startDate = new Date(yesterday);
    const endDate = new Date(yesterday);

    // If time has (+1) or is between 00:00-03:59, it's next day
    if (startTime.includes('(+1)') || (startHour >= 0 && startHour < 4)) {
        startDate.setDate(today.getDate());
    }

    if (endTime.includes('(+1)') || (endHour >= 0 && endHour < 4)) {
        endDate.setDate(today.getDate());
    }

    // Set hours and minutes
    startDate.setHours(startHour, startMin, 0);
    endDate.setHours(endHour, endMin, 0);

    // Format dates to YYYY-MM-DD HH:MM
    const formatDate = (d) => {
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return {
        startTime: formatDate(startDate),
        endTime: formatDate(endDate)
    };
}

/**
 * Formats absolute minutes into HH:MM format with (+1) notation for next day times.
 * Uses absolute minutes scale where:
 * - 240 = 04:00 (timeline start)
 * - 1440 = 00:00(+1)
 * - 1680 = 04:00(+1) (timeline end)
 *
 * @param {number} minutes - Absolute minutes (240 = 04:00, 1680 = 04:00(+1))
 * @param {boolean} isEndTime - Whether this time is an end time (affects (+1) notation)
 * @returns {string} Formatted time string (e.g., "04:00", "00:00(+1)", "04:00(+1)")
 */
export function formatTimeHHMM(minutes, isEndTime = false) {
    const totalMinutes = minutes % 1440; // Normalize to 0-1439
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const isNextDay = minutes >= 1440;

    // Special case for exact 24-hour wrap
    const isMidnightWrap = isEndTime && totalMinutes === 240; // 04:00 next day

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${isNextDay || isMidnightWrap ? '(+1)' : ''
        }`;
}

export function timeToMinutes(timeStr) {
    if (typeof timeStr === 'number') return Math.round(timeStr);

    const isNextDay = timeStr.includes('(+1)');
    const timeOnly = timeStr.replace('(+1)', '').trim();
    const [hours, minutes] = timeOnly.split(':').map(Number);

    // Calculate absolute minutes since midnight
    let totalMinutes = (hours * 60) + minutes;

    // Adjust for next day notation
    if (isNextDay) totalMinutes += 1440;

    return totalMinutes;
}

export function findNearestMarkers(minutes, isMobile = false) {
    const INCREMENT_MINUTES = 10;
    const hourMinutes = Math.floor(minutes / 60) * 60;
    const minutePart = minutes % 60;
    const lowerMarker = hourMinutes + Math.floor(minutePart / INCREMENT_MINUTES) * INCREMENT_MINUTES;
    const upperMarker = hourMinutes + Math.ceil(minutePart / INCREMENT_MINUTES) * INCREMENT_MINUTES;
    return [lowerMarker, upperMarker];
}

export function minutesToPercentage(minutes) {
    const TIMELINE_START = 240; // 04:00 in minutes
    const TIMELINE_HOURS = 24;

    // Normalize minutes to be relative to timeline start (04:00 AM)
    let minutesSinceStart = minutes - TIMELINE_START;

    // If the time is before 04:00 AM, adjust it to be after the previous day
    if (minutes < TIMELINE_START) {
        minutesSinceStart += MINUTES_PER_DAY;
    }

    // Calculate percentage, ensuring it stays within 0-100 range
    return Math.min(100, Math.max(0, (minutesSinceStart / MINUTES_PER_DAY) * 100));
}

export function positionToMinutes(positionPercent, isMobile = false, options = {}) {
    const TIMELINE_START = 240; // 4:00 AM in absolute minutes
    const TIMELINE_END = 1680; // 4:00 AM (+1) in absolute minutes
    const VISIBLE_TIMELINE_MINUTES = TIMELINE_END - TIMELINE_START; // 1440 minutes

    // Convert percentage to absolute timeline minutes
    let timelineMinutes = TIMELINE_START + (positionPercent / 100) * VISIBLE_TIMELINE_MINUTES;

    // Round to nearest 10 minutes
    let roundedMinutes = Math.round(timelineMinutes / 10) * 10;

    // Check for allowEnd option (defaults to false)
    const allowEnd = options.allowEnd === true;

    // For new activity placements, clamp so that start time never reaches TIMELINE_END.
    if (!allowEnd && roundedMinutes >= TIMELINE_END) {
        roundedMinutes = TIMELINE_END - 10;
    }

    // Set maximum value based on allowEnd flag:
    const maxVal = allowEnd ? TIMELINE_END : TIMELINE_END - 10;

    // Clamp within timeline bounds and return the value
    return Math.min(maxVal, Math.max(TIMELINE_START, roundedMinutes));
}


export function calculateMinimumBlockWidth() {
    const INCREMENT_MINUTES = 10;
    const TIMELINE_HOURS = 24;
    return (INCREMENT_MINUTES / (TIMELINE_HOURS * 60)) * 100;
}

export function hasOverlap(startMinutes, endMinutes, excludeBlock = null) {
    const currentData = getCurrentTimelineData();
    const MINUTES_IN_DAY = 1440;
    const TIMELINE_START = 240; // 4:00 AM in minutes

    // Normalize minutes to timeline's 4:00 AM start
    function normalizeMinutes(minutes) {
        if (minutes < TIMELINE_START) {
            minutes += MINUTES_IN_DAY;
        }
        return minutes;
    }

    // Normalize the new activity times
    const normalizedStart = normalizeMinutes(startMinutes);
    const normalizedEnd = normalizeMinutes(endMinutes);

    return currentData.some(activity => {
        if (excludeBlock && activity.id === excludeBlock) return false;

        // Convert activity times to minutes since midnight
        const activityStartTime = activity.startTime.split(' ')[1];
        const activityEndTime = activity.endTime.split(' ')[1];
        const [startHour, startMin] = activityStartTime.split(':').map(Number);
        const [endHour, endMin] = activityEndTime.split(':').map(Number);

        const activityStartMinutes = normalizeMinutes(startHour * 60 + startMin);
        const activityEndMinutes = normalizeMinutes(endHour * 60 + endMin);

        // Check for overlap considering the normalized timeline
        const hasOverlap = (
            Math.max(normalizedStart, activityStartMinutes) <
            Math.min(normalizedEnd, activityEndMinutes)
        );

        if (hasOverlap && DEBUG_MODE) {
            console.warn('Overlap detected:', {
                new: {
                    start: startMinutes,
                    end: endMinutes,
                    normalizedStart,
                    normalizedEnd
                },
                existing: {
                    start: startHour * 60 + startMin,
                    end: endHour * 60 + endMin,
                    normalizedStart: activityStartMinutes,
                    normalizedEnd: activityEndMinutes
                },
                activity: activity.activity
            });
        }

        return hasOverlap;
    });
}

// ... [Other imports and code]

export function canPlaceActivity(newStart, newEnd, excludeId = null) {
    // Get current timeline key and activities
    const currentKey = getCurrentTimelineKey();
    const activities = window.timelineManager.activities[currentKey] || [];

    // Normalize minutes to handle day wrap-around
    const MINUTES_IN_DAY = 1440;
    const TIMELINE_START = 240; // 4:00 AM in minutes

    function normalizeMinutes(minutes) {
        if (minutes < TIMELINE_START) {
            minutes += MINUTES_IN_DAY;
        }
        return minutes;
    }

    // Normalize the new activity times
    const normalizedNewStart = normalizeMinutes(newStart);
    const normalizedNewEnd = normalizeMinutes(newEnd);

    // Check for overlaps in current timeline only
    const hasOverlap = activities.some(activity => {
        if (excludeId && activity.id === excludeId) return false;

        // Extract and normalize existing activity times
        const [activityStartHour, activityStartMin] = activity.startTime.split(' ')[1].split(':').map(Number);
        const [activityEndHour, activityEndMin] = activity.endTime.split(' ')[1].split(':').map(Number);

        const activityStart = activityStartHour * 60 + activityStartMin;
        const activityEnd = activityEndHour * 60 + activityEndMin;

        const normalizedActivityStart = normalizeMinutes(activityStart);
        const normalizedActivityEnd = normalizeMinutes(activityEnd);

        // Check for overlap considering normalized times and 10-minute increments
        const overlaps = (
            normalizedNewStart < normalizedActivityEnd &&
            normalizedNewEnd > normalizedActivityStart
        );

        if (DEBUG_MODE && overlaps) {
            console.warn('Overlap detected:', {
                existingActivity: activity.activity,
                newTime: `${newStart}-${newEnd}`,
                existingTime: `${activity.startTime}-${activity.endTime}`,
                normalizedTimes: {
                    new: [normalizedNewStart, normalizedNewEnd],
                    existing: [normalizedActivityStart, normalizedActivityEnd]
                }
            });
        }

        return overlaps;
    });

    return !hasOverlap;
}


export function currentcoverage() {

    const currentData = getCurrentTimelineData();

    var coveredMinutes = 0;
    for (var i = 0; i < currentData.length; i++) {
        var activity = currentData[i];
        const startMinutes = new Date(activity.startTime)
        const endMinutes = new Date(activity.endTime)

        const diffMs = endMinutes - startMinutes;
        const diffMins = Math.round(diffMs / 60000);

        coveredMinutes += diffMins;
    }

    return (coveredMinutes / MINUTES_PER_DAY) * 100



}

export function calculateTimeDifference(startTime, endTime) {
    // Special case: If start is 4:00 and end is 4:00(+1), it's a full day
    if (startTime === '04:00' && endTime === '04:00(+1)') {
        return 1440; // 24 hours * 60 minutes
    }

    // Convert both times to minutes since midnight
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Handle special case for 04:00 to 00:00
    if (startMinutes === 240 && endMinutes === 0) { // 240 = 4:00
        return 1200; // 20 hours = 1200 minutes
    }

    // Calculate difference
    let difference = endMinutes - startMinutes;

    // If end time is before start time, add 24 hours worth of minutes
    if (difference <= 0) {
        difference += 1440; // 24 hours * 60 minutes
    }

    return difference;
}

export function isOverlapping(elem1, elem2) {
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}
function dividirActividadEnTramos(principal, b, key) {
    const resultado = [];

    principal.forEach(act => {
        const actInicio = new Date(act.hora_inicio).getTime();
        const actFin = new Date(act.hora_termino).getTime();

        b.forEach(sat => {
            const satInicio = new Date(sat.hora_inicio).getTime();
            const satFin = new Date(sat.hora_termino).getTime();
            const valor =
                sat.otroValor
                || sat.valor_numerico
                || sat.nombre_actividad
                || sat.nombre_subcategoria
                || sat.nombre_categoria
                || sat.nombre_dimension

                || "(sin nombre)";
            const cruce = calcularSuperposicionDesde(actInicio, actFin, satInicio, satFin);
            if (cruce) {
                resultado.push({
                    ...act,
                    hora_inicio: new Date(cruce.inicio).toISOString(),
                    hora_termino: new Date(cruce.fin).toISOString(),
                    minutos: cruce.minutos,

                    [key]: valor
                });
            }
        });
    });

    return resultado;
}
function calcularSuperposicionDesde(actInicio, actFin, satInicio, satFin) {
    const inicio = Math.max(actInicio, satInicio);
    const fin = Math.min(actFin, satFin);
    if (inicio < fin) {
        return { inicio, fin, minutos: (fin - inicio) / (1000 * 60) };
    }
    return null;
}

export function createTimelineDataFrame() {
    const agrupado = new Map();

    const timelineKeys = window.timelineManager.keys;
    const identificador = localStorage.getItem('identificador');
    const ronda = localStorage.getItem('id_ronda');

    // Paso 1: agrupar las actividades por dimensión
    timelineKeys.forEach(timelineKey => {
        const activities = window.timelineManager.activities[timelineKey] || [];

        activities.forEach(activity => {
            const start = new Date(activity.startTime);
            const end = new Date(activity.endTime);
            const minutos = Math.round((end - start) / 60000);

            const row = {
                id_estudio: activity.id_estudio || null,
                id_dimension: activity.id_dimension,
                id_categoria: activity.id_categoria,
                id_subcategoria: activity.id_subcategoria,
                id_actividad: activity.id_actividad ?? null,
                id_ronda: ronda,
                nombre_dimension: activity.dimension,
                nombre_categoria: activity.categoria,
                nombre_subcategoria: activity.subcategoria,
                nombre_actividad: activity.nombre_actividad ?? null,
                valor_numerico: activity.maneja_numeros ? parseInt(activity.subcategoria.replace(/\D/g, '')) : null,
                color: activity.color,
                otroValor: activity.categoria.includes('Otros') ? activity.name : null,
                hora_inicio: activity.startTime,
                hora_termino: activity.endTime,
                identificador,
                minutos
            };

            const dimension = row.nombre_dimension;
            if (!agrupado.has(dimension)) agrupado.set(dimension, []);
            agrupado.get(dimension).push(row);
        });
    });


    const tramos = dividirActividadPrincipalEnTramos(agrupado);

    return tramos;
}
function toMySQLDatetime(dateISO) {
    const date = new Date(dateISO);
    const pad = n => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function dividirActividadPrincipalEnTramos(agrupado) {
    let tramos = agrupado.get("Principal")?.map(act => {
        const actInicio = new Date(act.hora_inicio).getTime();
        const actFin = new Date(act.hora_termino).getTime();
        return {
            ...act,
            hora_inicio: new Date(actInicio).toISOString(),
            hora_termino: new Date(actFin).toISOString(),
            minutos: (actFin - actInicio) / (1000 * 60)
        };
    }) || [];

    const otrasDimensiones = Array.from(agrupado.entries()).filter(([key]) => key !== "Principal");

    // Procesar cada dimensión adicional de forma acumulativa
    otrasDimensiones.forEach(([nombreDim, lista]) => {
        const nuevosTramos = [];

        tramos.forEach(tramo => {
            const actInicio = new Date(tramo.hora_inicio).getTime();
            const actFin = new Date(tramo.hora_termino).getTime();

            const cortes = new Set([actInicio, actFin]);

            lista.forEach(dim => {
                const dimInicio = new Date(dim.hora_inicio).getTime();
                const dimFin = new Date(dim.hora_termino).getTime();
                const cruce = calcularSuperposicionDesde(actInicio, actFin, dimInicio, dimFin);
                if (cruce) {
                    cortes.add(cruce.inicio);
                    cortes.add(cruce.fin);
                }
            });

            const cortesOrdenados = Array.from(cortes).sort((a, b) => a - b);

            for (let i = 0; i < cortesOrdenados.length - 1; i++) {
                const inicio = cortesOrdenados[i];
                const fin = cortesOrdenados[i + 1];
                if (inicio >= fin) continue;

                const subTramo = {
                    ...tramo,
                    hora_inicio: toMySQLDatetime(inicio),
                    hora_termino: toMySQLDatetime(fin),
                    minutos: (fin - inicio) / (1000 * 60)
                };

                // Buscar si este subtramo tiene un valor en la dimensión actual
                const valorDim = lista.find(d => {
                    const dimInicio = new Date(d.hora_inicio).getTime();
                    const dimFin = new Date(d.hora_termino).getTime();
                    return inicio >= dimInicio && fin <= dimFin;
                });

                const clave = valorDim?.valor_numerico
                    ?? valorDim?.nombre_actividad
                    ?? valorDim?.nombre_subcategoria
                    ?? valorDim?.nombre_categoria
                    ?? valorDim?.nombre_dimension
                    ?? valorDim?.otroValor
                    ?? "(sin nombre)";
                const nombre = nombreDimension(nombreDim);
                subTramo[nombre.toLowerCase()] = clave;

                nuevosTramos.push(subTramo);
            }
        });

        tramos = nuevosTramos;
    });
    console.log(tramos)
    return tramos;
}

function nombreDimension(nombre) {
    if (nombre == "¿Dónde?") {
        return "ubicación";
    }
    else if (nombre == "¿Con quién?") {
        return "compañia";
    }

    return nombre;
}




/**
 * Sends timeline and participant data to DataPipe API.
 *
 * This function performs the following steps:
 * 1. Prepare the timeline data and ensure each record contains the unique identifier (pid).
 * 2. Send the data to DataPipe API endpoint.
 * 3. Handle redirect to thank you page.
 */
export async function sendDataToDataPipe() {
    try {
        // --- Prepare Timeline Data ---
        const timelineData = createTimelineDataFrame();
        const ronda = localStorage.getItem('id_ronda')
        const identificador = localStorage.getItem('identificador')
        /* const identificador = localStorage.getItem('identificador')
        // Get study data if available
        let studyData = window.timelineManager?.study || {};
        let pid;

        // Check if ppid exists and is not empty
        const hasPpid = (studyData.ppid !== undefined && studyData.ppid !== null && studyData.ppid !== '') ||
            (studyData.PPID !== undefined && studyData.PPID !== null && studyData.PPID !== '');

        if (hasPpid) {
            // Use ppid as pid when ppid is not empty
            pid = studyData.ppid || studyData.PPID;
        } else if (!('pid' in studyData) && !('PID' in studyData)) {
            // Generate random pid if neither pid nor ppid exists
            pid = ('0000000000000000' + Math.floor(Math.random() * 1e16)).slice(-16);
            studyData.pid = pid;
        } else {
            // Use existing pid if ppid doesn't exist but pid does
            pid = studyData.pid || studyData.PID;
        }

        // --- Prepare Participant Data ---
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const layoutHorizontal = viewportWidth >= 1440;

        // Get browser info if available
        let browserInfo = { name: 'unknown', version: 'unknown' };
        if (window.bowser) {
            const browserParser = window.bowser.getParser(window.navigator.userAgent);
            browserInfo = {
                name: browserParser.getBrowserName(),
                version: browserParser.getBrowserVersion()
            };
        }
        
        // Determine session_id based on whether ppid exists
        const session_id = hasPpid && (studyData.survey || studyData.SURVEY)
            ? (studyData.survey || studyData.SURVEY)
            : (studyData.SESSION_ID || null);
        
        // Combine timeline and participant data
        const combinedData = timelineData.map(row => ({
           
            id_estudio: row.id_estudio || null,
            identificador: identificador,
            id_dimension: row.id_dimension,
            id_categoria: row.id_categoria,
            id_subcategoria: row.id_subcategoria,
            id_actividad: row.id_actividad != null ? row.id_actividad : null,
            id_ronda: ronda,
            nombre_categoria: row.categoria,
            nombre_dimension: row.dimension,
            nombre_subcategoria: row.subcategoria,
            nombre_actividad: row.nombre_actividad != null ? row.nombre_actividad : null,
            valor_numerico: row.maneja_numeros ? parseInt(row.subcategoria.replace(/\D/g, '')) : null,
            minutos: row.minutos,
            color: row.color,
            otroValor: row.categoria.includes('Otra actividad') ? row.name : null,
            hora_inicio: row.startTime,
            hora_termino: row.endTime,
         

        })); */
        console.log(timelineData.length)
        const res = await TimelineApi.saveTimelineData(timelineData);

        if (res.status == 201) {

            const payload = {
                id_ronda: ronda,
                identificador: identificador,
                fecha_finalizacion: new Date().toISOString()
            }
            const res2 = await RondasApi.finalizarRonda(payload);
            window.location.href = 'rondas.html';
        }

        hideLoadingModal();
        // completar la ronda correspondiente en la base de datos



        // Convert to CSV format
        /*  const csvData = convertArrayToCSV(combinedData);
 
         // Generate unique filename with timestamp
         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
         const filename = `timeline_${pid}_${timestamp}.csv`; */
        //Accept: "*/*",
        // Send to DataPipe API
        /* const response = await fetch("https://pipe.jspsych.org/api/data/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
           
          },
          body: JSON.stringify({
            experimentID: window.timelineManager?.general?.experimentID || "eR8ENvJPgQth",
            filename: filename,
            data: csvData,
          }),
        });
    
        if (!response.ok) {
          throw new Error(`DataPipe API request failed: ${response.status} ${response.statusText}`);
        }
    
        console.log('Data sent to DataPipe successfully'); */

        // Hide loading modal before redirect

        /* 
                // Handle redirect to thank you page
                const redirectUrl = window.timelineManager?.general?.primary_redirect_url;
        
                if (redirectUrl) {
                    // Check if it's a relative URL (like our thank-you.html page)
                    if (!redirectUrl.startsWith('http')) {
                        // For relative URLs, just redirect directly
                        window.location.href = redirectUrl;
                    } else {
                        // For external URLs, preserve existing URL parameters
                        const currentParams = new URLSearchParams(window.location.search);
                        const separator = redirectUrl.includes('?') ? '&' : '?';
                        const finalRedirectUrl = redirectUrl +
                            (currentParams.toString() ? separator + currentParams.toString() : '');
        
                        window.location.href = finalRedirectUrl;
                    }
                } */

        return { success: true };
    } catch (error) {
        console.error('Error sending data to DataPipe:', error);
        showToast('error', 'Error al enviar los datos, intenta en otro momento', 'top-center', 2000);
        // Hide loading modal on error
        hideLoadingModal();

        return { success: false, error: error.message };
    }
}

export function validateMinCoverage(coverage) {
    // Convert to number if it's a string
    const numCoverage = parseInt(coverage);

    // Check if it's a valid number
    if (isNaN(numCoverage)) {
        throw new Error('min_coverage must be a valid number');
    }

    // Check range
    if (numCoverage < 0 || numCoverage > 1440) {
        throw new Error('min_coverage must be between 0 and 1440');
    }

    // Check if divisible by 10
    if (numCoverage % 10 !== 0) {
        throw new Error('min_coverage must be divisible by 10');
    }

    return numCoverage;
}

/**
 * Calculates the total time coverage of the current timeline by summing up
 * the blockLength of all activities.
 * 
 * @returns {number} Total minutes covered by all activities in the current timeline
 */
export function getTimelineCoverage() {
    const currentKey = getCurrentTimelineKey();
    const activities = window.timelineManager.activities[currentKey] || [];

    return activities.reduce((total, activity) => total + activity.blockLength, 0);
}

function validateActivityBlockTransformation(startMinutes, endMinutes, target) {
    const MIN_BLOCK_LENGTH = 10;
    const TIMELINE_START = 240; // 4:00 AM in absolute minutes
    const TIMELINE_END = 1680; // 4:00 AM next day in absolute minutes

    // No normalization needed - inputs should already be absolute
    const blockLength = endMinutes - startMinutes;

    // Validate block length
    if (blockLength <= 0 || blockLength < MIN_BLOCK_LENGTH) {
        console.warn('Invalid block length:', {
            startTime: formatTimeHHMM(startMinutes),
            endTime: formatTimeHHMM(endMinutes),
            length: blockLength,
            minLength: MIN_BLOCK_LENGTH
        });
        return false;
    }

    // Validate timeline bounds
    const isStartValid = (startMinutes >= TIMELINE_START && startMinutes <= TIMELINE_END) ||
        (startMinutes + 1440 >= TIMELINE_START && startMinutes + 1440 <= TIMELINE_END);

    const isEndValid = (endMinutes >= TIMELINE_START && endMinutes <= TIMELINE_END) ||
        (endMinutes + 1440 >= TIMELINE_START && endMinutes + 1440 <= TIMELINE_END);

    if (!isStartValid || !isEndValid) {
        console.warn('Time out of valid range:', {
            startTime: formatTimeHHMM(startMinutes),
            endTime: formatTimeHHMM(endMinutes),
            validRange: '04:00-04:00(+1)'
        });
        return false;
    }

    return true;
}

/**
 * Formats a time for timeline start/end with next-day marker when needed
 * @param {number} minutes - Absolute minutes (240 = 04:00, 1680 = 04:00(+1))
 * @param {boolean} isEndTime - Whether this is an end time (affects (+1) notation)
 * @returns {string} Formatted time string with (+1) when needed
 */
export function formatTimelineTime(minutes, isEndTime = false) {
    const h = Math.floor((minutes % 1440) / 60);
    const m = Math.floor(minutes % 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    // Add (+1) marker for:
    // 1. Times between 00:00-03:59 (0-239 minutes)
    // 2. When minutes >= 1440 (next day)
    // 3. When it's exactly 04:00 next day (1680 minutes) and it's an end time
    const needsNextDayMarker = minutes < 240 || minutes >= 1440 || (isEndTime && minutes === 240);

    return needsNextDayMarker ? `${timeStr}(+1)` : timeStr;
}

// Helper functions specifically for timeline start and end times
export function formatTimelineStart(minutes) {
    return formatTimelineTime(minutes, false);
}

export function formatTimelineEnd(minutes) {
    return formatTimelineTime(minutes, true);
}

// Add after the imports at the top
let debugOverlay = null;

export function toggleDebugOverlay(show = true) {
    if (show && !debugOverlay) {
        // Create debug overlay
        debugOverlay = document.createElement('div');
        debugOverlay.id = 'debug-overlay';
        debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            min-width: 200px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            pointer-events: auto;
            cursor: move;
            user-select: none;
            border: 1px solid #444;
        `;
        document.body.appendChild(debugOverlay);

        // Make overlay draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        debugOverlay.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === debugOverlay) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                debugOverlay.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            isDragging = false;
        }

        // Add mousemove listener to active timeline
        const updateDebugInfo = (e) => {
            const activeTimeline = document.querySelector('.timeline[data-active="true"]');
            if (!activeTimeline || !debugOverlay) return;

            const rect = activeTimeline.getBoundingClientRect();
            const isMobile = window.innerWidth <= 1440;

            // Calculate relative position
            let relativePos;
            let positionPercent;

            if (isMobile) {
                relativePos = e.clientY - rect.top;
                positionPercent = (relativePos / rect.height) * 100;
            } else {
                relativePos = e.clientX - rect.left;
                positionPercent = (relativePos / rect.width) * 100;
            }

            // Calculate time
            const minutes = positionToMinutes(positionPercent);
            const timeStr = formatTimeHHMM(minutes);

            // Update debug overlay content
            debugOverlay.innerHTML = `
                <div style="margin-bottom: 8px; font-weight: bold; color: #00ff00;">Cursor Debug</div>
                <div style="border-bottom: 1px solid #444; margin-bottom: 8px;"></div>
                Position: ${Math.round(relativePos)}px<br>
                Percent: ${positionPercent.toFixed(2)}%<br>
                Minutes: ${minutes}<br>
                Time: ${timeStr}<br>
                Mode: ${isMobile ? 'Vertical' : 'Horizontal'}<br>
                <div style="font-size: 10px; margin-top: 8px; color: #888;">
                    (Drag to move)
                </div>
            `;
        };

        // Add mousemove listener to document
        document.addEventListener('mousemove', updateDebugInfo);

    } else if (!show && debugOverlay) {
        debugOverlay.remove();
        debugOverlay = null;
    }
}

// Make toggleDebugOverlay available globally
window.toggleDebugOverlay = toggleDebugOverlay;

/**
 * Validates that if the startTime string includes the (+1) marker,
 * then the endTime string must also include it.
 * This enforces that an activity starting on the next day (indicated by (+1))
 * cannot have an end time without the next-day marker.
 *
 * @param {string} startTime - The start time string (e.g., "01:10(+1)")
 * @param {string} endTime - The end time string (e.g., "02:20" or "02:20(+1)")
 * @throws {Error} if startTime includes (+1) but endTime does not.
 * @returns {boolean} true if the time markers are valid.
 */
export function validateTimeMarkers(startTime, endTime) {
    if (startTime.includes('(+1)') && !endTime.includes('(+1)')) {
        throw new Error("Invalid time markers: if startTime includes '(+1)', then endTime must also include '(+1)'.");
    }
    return true;
}

// Helper function to convert an array of objects into a CSV string
function convertArrayToCSV(array) {
    if (array.length === 0) {
        return "";
    }
    const keys = Object.keys(array[0]);
    const csvRows = [];
    // header row
    csvRows.push(keys.join(','));
    // data rows
    array.forEach(row => {
        const values = keys.map(key => {
            let value = row[key] || "";
            // escape quotes by doubling, and enclose in quotes if needed
            value = String(value).replace(/"/g, '""');
            if (value.search(/("|,|\n)/g) >= 0) {
                value = `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
}

// Helper function to trigger a CSV download in the browser
function downloadCSV(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * sendData function to either send data via DataPipe or download as CSV locally.
 * 
 * @param {Object} options - Options to control the sending behavior.
 *   Use { mode: 'datapipe' } to upload via DataPipe API,
 *   or { mode: 'csv' } to trigger a CSV file download.
 *   During development, the default is 'datapipe' mode.
 */
export async function sendData(options = { mode: 'datapipe' }) {
    // Sync URL parameters before sending data
    syncURLParamsToStudy();

    if (options.mode === 'datapipe') {
        // Call the function that sends data to DataPipe
        return await sendDataToDataPipe();
    } else if (options.mode === 'csv') {
        // Create timeline data frame and convert to CSV for download
        const dataFrame = createTimelineDataFrame();
        const csv = convertArrayToCSV(dataFrame);
        downloadCSV(csv, 'timeline_data.csv');

        // Hide loading modal after CSV download
        hideLoadingModal();
    } else {
        throw new Error(`Unsupported send mode: ${options.mode}`);
    }
}

export function checkAndRequestPID() {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('pid');

    if (!pid) {
        // Temporarily disabled modal - instead generate a random PID
        const randomPid = ('0000000000000000' + Math.floor(Math.random() * 1e16)).slice(-16);

        // Update URL with the random PID
        urlParams.set('pid', randomPid);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);

        // Update timelineManager.study with the random PID
        if (!window.timelineManager.study) {
            window.timelineManager.study = {};
        }
        window.timelineManager.study.pid = randomPid;

        console.log('PID modal disabled - generated random PID:', randomPid);
    }
}

export function syncURLParamsToStudy() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!window.timelineManager.study) {
        window.timelineManager.study = {};
    }

    // Sync all URL parameters into the study object
    for (const [key, value] of urlParams) {
        window.timelineManager.study[key] = value;
    }
}
