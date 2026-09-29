import { BoxDimensions, BoxPlacement, MosaicPattern, MosaicType, PalletDimensions, PalletStabilityInfo, CartesianInfeedGroup, ChimneyHole } from '../types/pallet';

/**
 * Checks if two bounding boxes overlap
 */
function boxesOverlap(b1: { x: number; y: number; w: number; h: number }, b2: { x: number; y: number; w: number; h: number }): boolean {
  return !(b1.x + b1.w <= b2.x || b2.x + b2.w <= b1.x || b1.y + b1.h <= b2.y || b2.y + b2.h <= b1.y);
}

/**
 * Creates a Cartesian perimeter-first grid of boxes packed in a rectangular region.
 * In automated Cartesian palletizing, boxes MUST be flush with the perimeter (0 mm outer setback),
 * and any leftover gap / clearance is pushed to the CENTER (forming the central chimney / gaps).
 */
function packCartesianGrid(
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  boxW: number,
  boxH: number,
  rotated: boolean,
  startId: number,
  blockId: number = 1
): BoxPlacement[] {
  const placements: BoxPlacement[] = [];
  const countX = Math.floor(regionW / boxW);
  const countY = Math.floor(regionH / boxH);

  if (countX === 0 || countY === 0) return placements;

  const totalUsedW = countX * boxW;
  const remW = regionW - totalUsedW; // gap to place in the middle
  const totalUsedH = countY * boxH;
  const remH = regionH - totalUsedH; // gap to place in the middle

  // In cartesian palletizing, outer rows and columns are flush with perimeter boundaries.
  // The gap is split between the central rows and columns.
  const splitCol = Math.ceil(countX / 2);
  const splitRow = Math.ceil(countY / 2);

  let curId = startId;
  for (let r = 0; r < countY; r++) {
    // If r >= splitRow, push down by remH so the bottom-most row touches regionY + regionH
    const y = (countY > 1 && r >= splitRow)
      ? regionY + r * boxH + remH
      : regionY + r * boxH;

    for (let c = 0; c < countX; c++) {
      // If c >= splitCol, push right by remW so the right-most column touches regionX + regionW
      const x = (countX > 1 && c >= splitCol)
        ? regionX + c * boxW + remW
        : regionX + c * boxW;

      placements.push({
        id: curId++,
        x: Math.round(x),
        y: Math.round(y),
        w: boxW,
        h: boxH,
        rotated,
        blockId
      });
    }
  }
  return placements;
}

/**
 * Computes the Central Chimney Hole (Hueco Central) and center inter-row air gaps for a given layer
 */
function detectChimneyHoles(layer: BoxPlacement[], PL: number, PW: number): ChimneyHole[] {
  const holes: ChimneyHole[] = [];
  if (layer.length === 0) return holes;

  // Find min/max box boundaries along perimeter
  const leftEdgeBoxes = layer.filter(b => b.x <= 15);
  const rightEdgeBoxes = layer.filter(b => b.x + b.w >= PL - 15);
  const topEdgeBoxes = layer.filter(b => b.y <= 15);
  const bottomEdgeBoxes = layer.filter(b => b.y + b.h >= PW - 15);

  // 1. Classic Windmill / Chimney Hole in the core
  if (leftEdgeBoxes.length > 0 && rightEdgeBoxes.length > 0) {
    const maxLeftX = Math.max(...leftEdgeBoxes.map(b => b.x + b.w));
    const minRightX = Math.min(...rightEdgeBoxes.map(b => b.x));

    if (minRightX > maxLeftX + 5) {
      const gapW = minRightX - maxLeftX;

      if (topEdgeBoxes.length > 0 && bottomEdgeBoxes.length > 0) {
        const maxTopY = Math.max(...topEdgeBoxes.map(b => b.y + b.h));
        const minBottomY = Math.min(...bottomEdgeBoxes.map(b => b.y));

        if (minBottomY > maxTopY + 5) {
          const gapH = minBottomY - maxTopY;
          const isOccupied = layer.some(b => boxesOverlap(b, { x: maxLeftX, y: maxTopY, w: gapW, h: gapH }));
          if (!isOccupied) {
            holes.push({
              x: maxLeftX,
              y: maxTopY,
              width: gapW,
              height: gapH,
              areaMm2: gapW * gapH,
              isCentral: true,
              type: 'chimenea_central',
              label: `Chimenea Central de Aireación (${gapW} × ${gapH} mm)`
            });
          }
        }
      }
    }
  }

  // 2. Center longitudinal / transversal internal gaps between rows
  // Find internal gaps along X
  const uniqueXEnd = Array.from(new Set(layer.map(b => b.x + b.w))).sort((a, b) => a - b);
  for (const endX of uniqueXEnd) {
    if (endX >= PL - 25 || endX <= 25) continue;
    const nextStartBoxes = layer.filter(b => b.x > endX && b.x <= endX + 80);
    if (nextStartBoxes.length > 0) {
      const nextStartX = Math.min(...nextStartBoxes.map(b => b.x));
      const gap = nextStartX - endX;
      if (gap >= 10 && gap <= 200) {
        // Internal gap between columns
        const isAlreadyAdded = holes.some(h => Math.abs(h.x - endX) <= 15);
        if (!isAlreadyAdded) {
          holes.push({
            x: endX,
            y: 0,
            width: gap,
            height: PW,
            areaMm2: gap * PW,
            isCentral: true,
            type: 'calle_transversal',
            label: `Calle Interior Central X (${gap} mm de holgura)`
          });
        }
      }
    }
  }

  // Find internal gaps along Y
  const uniqueYEnd = Array.from(new Set(layer.map(b => b.y + b.h))).sort((a, b) => a - b);
  for (const endY of uniqueYEnd) {
    if (endY >= PW - 25 || endY <= 25) continue;
    const nextStartBoxes = layer.filter(b => b.y > endY && b.y <= endY + 80);
    if (nextStartBoxes.length > 0) {
      const nextStartY = Math.min(...nextStartBoxes.map(b => b.y));
      const gap = nextStartY - endY;
      if (gap >= 10 && gap <= 200) {
        const isAlreadyAdded = holes.some(h => Math.abs(h.y - endY) <= 15);
        if (!isAlreadyAdded) {
          holes.push({
            x: 0,
            y: endY,
            width: PL,
            height: gap,
            areaMm2: gap * PL,
            isCentral: true,
            type: 'calle_longitudinal',
            label: `Calle Interior Central Y (${gap} mm de holgura)`
          });
        }
      }
    }
  }

  return holes;
}

/**
 * Computes the Cartesian Infeed Sequences & Pick Groups for a robotic palletizer head
 */
function computeCartesianInfeedGroups(layer: BoxPlacement[], PL: number, PW: number): CartesianInfeedGroup[] {
  if (layer.length === 0) return [];

  const groups: CartesianInfeedGroup[] = [];
  const assigned = new Set<number>();

  // Helper: group boxes along horizontal line (same Y and height)
  function findHorizontalGroup(boxes: BoxPlacement[]): BoxPlacement[] {
    if (boxes.length === 0) return [];
    const sorted = [...boxes].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const group = [first];
    for (let i = 1; i < sorted.length; i++) {
      const prev = group[group.length - 1];
      const cur = sorted[i];
      if (Math.abs(cur.y - prev.y) <= 5 && cur.h === prev.h && cur.rotated === prev.rotated && Math.abs(cur.x - (prev.x + prev.w)) <= 15) {
        group.push(cur);
      }
    }
    return group;
  }

  // Helper: group boxes along vertical line (same X and width)
  function findVerticalGroup(boxes: BoxPlacement[]): BoxPlacement[] {
    if (boxes.length === 0) return [];
    const sorted = [...boxes].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const group = [first];
    for (let i = 1; i < sorted.length; i++) {
      const prev = group[group.length - 1];
      const cur = sorted[i];
      if (Math.abs(cur.x - prev.x) <= 5 && cur.w === prev.w && cur.rotated === prev.rotated && Math.abs(cur.y - (prev.y + prev.h)) <= 15) {
        group.push(cur);
      }
    }
    return group;
  }

  let stepNumber = 1;

  while (assigned.size < layer.length) {
    const unassigned = layer.filter(b => !assigned.has(b.id));
    if (unassigned.length === 0) break;

    // 1. Check Front Perimeter (Y + H == PW) - Infeed to South perimeter
    const frontCandidates = unassigned.filter(b => b.y + b.h >= PW - 15);
    if (frontCandidates.length > 0) {
      const groupBoxes = findHorizontalGroup(frontCandidates);
      groupBoxes.forEach(b => assigned.add(b.id));

      const minX = Math.min(...groupBoxes.map(b => b.x));
      const maxX = Math.max(...groupBoxes.map(b => b.x + b.w));
      const minY = Math.min(...groupBoxes.map(b => b.y));
      const maxY = Math.max(...groupBoxes.map(b => b.y + b.h));

      groups.push({
        step: stepNumber++,
        name: `Paso ${groups.length + 1}: Fila Perimetral Frontal (${groupBoxes.length} ${groupBoxes.length === 1 ? 'caja' : 'cajas'})`,
        side: 'Frontal (Sur)',
        boxIds: groupBoxes.map(b => b.id),
        boxesCount: groupBoxes.length,
        boxLength: groupBoxes[0].w,
        boxWidth: groupBoxes[0].h,
        rotated: groupBoxes[0].rotated,
        startX: minX,
        startY: minY,
        spanW: maxX - minX,
        spanH: maxY - minY,
        gripperAction: groupBoxes.length > 1 ? 'Toma en fila (2-4 cajas)' : 'Toma simple (1 caja)',
        entryAxis: 'Eje X (Longitudinal)',
        conveyorBatch: `Lote de ${groupBoxes.length} cajas en hilera (${groupBoxes[0].w}×${groupBoxes[0].h} mm)`,
        robotTrajectory: `Posicionamiento en Y=${minY} mm, avance transversal y depósito rasante contra borde Sur`,
        depositRange: `X: ${minX} → ${maxX} mm | Y: ${minY} → ${maxY} mm`
      });
      continue;
    }

    // 2. Check Rear Perimeter (Y == 0) - Infeed to North perimeter
    const rearCandidates = unassigned.filter(b => b.y <= 15);
    if (rearCandidates.length > 0) {
      const groupBoxes = findHorizontalGroup(rearCandidates);
      groupBoxes.forEach(b => assigned.add(b.id));

      const minX = Math.min(...groupBoxes.map(b => b.x));
      const maxX = Math.max(...groupBoxes.map(b => b.x + b.w));
      const minY = Math.min(...groupBoxes.map(b => b.y));
      const maxY = Math.max(...groupBoxes.map(b => b.y + b.h));

      groups.push({
        step: stepNumber++,
        name: `Paso ${groups.length + 1}: Fila Perimetral Trasera (${groupBoxes.length} ${groupBoxes.length === 1 ? 'caja' : 'cajas'})`,
        side: 'Trasero (Norte)',
        boxIds: groupBoxes.map(b => b.id),
        boxesCount: groupBoxes.length,
        boxLength: groupBoxes[0].w,
        boxWidth: groupBoxes[0].h,
        rotated: groupBoxes[0].rotated,
        startX: minX,
        startY: minY,
        spanW: maxX - minX,
        spanH: maxY - minY,
        gripperAction: groupBoxes.length > 1 ? 'Toma en fila (2-4 cajas)' : 'Toma simple (1 caja)',
        entryAxis: 'Eje X (Longitudinal)',
        conveyorBatch: `Lote de ${groupBoxes.length} cajas en hilera (${groupBoxes[0].w}×${groupBoxes[0].h} mm)`,
        robotTrajectory: `Desplazamiento a Y=0 mm, depósito rasante contra borde perimétrico Norte`,
        depositRange: `X: ${minX} → ${maxX} mm | Y: ${minY} → ${maxY} mm`
      });
      continue;
    }

    // 3. Check Left Perimeter (X == 0) - Infeed to West perimeter
    const leftCandidates = unassigned.filter(b => b.x <= 15);
    if (leftCandidates.length > 0) {
      const groupBoxes = findVerticalGroup(leftCandidates);
      groupBoxes.forEach(b => assigned.add(b.id));

      const minX = Math.min(...groupBoxes.map(b => b.x));
      const maxX = Math.max(...groupBoxes.map(b => b.x + b.w));
      const minY = Math.min(...groupBoxes.map(b => b.y));
      const maxY = Math.max(...groupBoxes.map(b => b.y + b.h));

      groups.push({
        step: stepNumber++,
        name: `Paso ${groups.length + 1}: Columna Lateral Izquierda (${groupBoxes.length} ${groupBoxes.length === 1 ? 'caja' : 'cajas'})`,
        side: 'Lateral Izquierdo (Oeste)',
        boxIds: groupBoxes.map(b => b.id),
        boxesCount: groupBoxes.length,
        boxLength: groupBoxes[0].w,
        boxWidth: groupBoxes[0].h,
        rotated: groupBoxes[0].rotated,
        startX: minX,
        startY: minY,
        spanW: maxX - minX,
        spanH: maxY - minY,
        gripperAction: groupBoxes.length > 1 ? 'Toma en fila (2-4 cajas)' : 'Toma simple (1 caja)',
        entryAxis: 'Eje Y (Transversal)',
        conveyorBatch: `Lote de ${groupBoxes.length} cajas agrupadas (${groupBoxes[0].w}×${groupBoxes[0].h} mm)`,
        robotTrajectory: `Descenso en X=0 mm, ajuste longitudinal al borde Oeste`,
        depositRange: `X: ${minX} → ${maxX} mm | Y: ${minY} → ${maxY} mm`
      });
      continue;
    }

    // 4. Check Right Perimeter (X + W == PL) - Infeed to East perimeter
    const rightCandidates = unassigned.filter(b => b.x + b.w >= PL - 15);
    if (rightCandidates.length > 0) {
      const groupBoxes = findVerticalGroup(rightCandidates);
      groupBoxes.forEach(b => assigned.add(b.id));

      const minX = Math.min(...groupBoxes.map(b => b.x));
      const maxX = Math.max(...groupBoxes.map(b => b.x + b.w));
      const minY = Math.min(...groupBoxes.map(b => b.y));
      const maxY = Math.max(...groupBoxes.map(b => b.y + b.h));

      groups.push({
        step: stepNumber++,
        name: `Paso ${groups.length + 1}: Columna Lateral Derecha (${groupBoxes.length} ${groupBoxes.length === 1 ? 'caja' : 'cajas'})`,
        side: 'Lateral Derecho (Este)',
        boxIds: groupBoxes.map(b => b.id),
        boxesCount: groupBoxes.length,
        boxLength: groupBoxes[0].w,
        boxWidth: groupBoxes[0].h,
        rotated: groupBoxes[0].rotated,
        startX: minX,
        startY: minY,
        spanW: maxX - minX,
        spanH: maxY - minY,
        gripperAction: groupBoxes.length > 1 ? 'Toma en fila (2-4 cajas)' : 'Toma simple (1 caja)',
        entryAxis: 'Eje Y (Transversal)',
        conveyorBatch: `Lote de ${groupBoxes.length} cajas agrupadas (${groupBoxes[0].w}×${groupBoxes[0].h} mm)`,
        robotTrajectory: `Alineación a X=${minX} mm, depósito rasante contra borde Este`,
        depositRange: `X: ${minX} → ${maxX} mm | Y: ${minY} → ${maxY} mm`
      });
      continue;
    }

    // 5. Remaining boxes are in the central core
    const centerGroup = findHorizontalGroup(unassigned);
    centerGroup.forEach(b => assigned.add(b.id));

    const minX = Math.min(...centerGroup.map(b => b.x));
    const maxX = Math.max(...centerGroup.map(b => b.x + b.w));
    const minY = Math.min(...centerGroup.map(b => b.y));
    const maxY = Math.max(...centerGroup.map(b => b.y + b.h));

    groups.push({
      step: stepNumber++,
      name: `Paso ${groups.length + 1}: Núcleo Interior Central (${centerGroup.length} ${centerGroup.length === 1 ? 'caja' : 'cajas'})`,
      side: 'Núcleo Central',
      boxIds: centerGroup.map(b => b.id),
      boxesCount: centerGroup.length,
      boxLength: centerGroup[0].w,
      boxWidth: centerGroup[0].h,
      rotated: centerGroup[0].rotated,
      startX: minX,
      startY: minY,
      spanW: maxX - minX,
      spanH: maxY - minY,
      gripperAction: centerGroup.length > 1 ? 'Toma en bloque' : 'Toma simple (1 caja)',
      entryAxis: 'Eje X o Y Central',
      conveyorBatch: `Lote interior de ${centerGroup.length} cajas`,
      robotTrajectory: `Inserción interior en X=${minX} mm, Y=${minY} mm respetando holguras centrales`,
      depositRange: `X: ${minX} → ${maxX} mm | Y: ${minY} → ${maxY} mm`
    });
  }

  return groups;
}

/**
 * Generates the Capitulado (Interlocking / Trabado) Layer B for a given Layer A.
 * In logistics, rotating 180° around the center of the pallet or reflecting creates
 * crossing box boundaries so seams do not align vertically.
 */
function generateCapituladoLayer(
  layerA: BoxPlacement[],
  palletL: number,
  palletW: number
): { layerB: BoxPlacement[]; interlockType: MosaicPattern['interlockType']; score: number } {
  if (layerA.length === 0) {
    return { layerB: [], interlockType: 'apilado_directo', score: 0 };
  }

  // Candidate 1: Rotate 180° around pallet center
  const rot180: BoxPlacement[] = layerA.map((box, idx) => ({
    id: idx + 1,
    x: palletL - (box.x + box.w),
    y: palletW - (box.y + box.h),
    w: box.w,
    h: box.h,
    rotated: box.rotated,
    blockId: box.blockId
  }));

  // Candidate 2: Mirror X (horizontal reflection)
  const mirrorX: BoxPlacement[] = layerA.map((box, idx) => ({
    id: idx + 1,
    x: palletL - (box.x + box.w),
    y: box.y,
    w: box.w,
    h: box.h,
    rotated: box.rotated,
    blockId: box.blockId
  }));

  // Candidate 3: Mirror Y (vertical reflection)
  const mirrorY: BoxPlacement[] = layerA.map((box, idx) => ({
    id: idx + 1,
    x: box.x,
    y: palletW - (box.y + box.h),
    w: box.w,
    h: box.h,
    rotated: box.rotated,
    blockId: box.blockId
  }));

  // Calculate seam stagger score for each candidate.
  // Higher score when edges in Layer A are covered by the solid center of boxes in Layer B.
  function evaluateInterlock(candidate: BoxPlacement[]): number {
    let crossedSeams = 0;
    let totalSeams = 0;

    // Check vertical seams of Layer A
    for (const boxA of layerA) {
      const rightEdge = boxA.x + boxA.w;
      if (rightEdge < palletL) {
        totalSeams++;
        // Check if candidate B has a box crossing this x coordinate inside boxA's y range
        const midY = boxA.y + boxA.h / 2;
        const crossingBox = candidate.find(
          bB => bB.x < rightEdge && bB.x + bB.w > rightEdge && bB.y <= midY && bB.y + bB.h >= midY
        );
        if (crossingBox) {
          crossedSeams++;
        }
      }

      const bottomEdge = boxA.y + boxA.h;
      if (bottomEdge < palletW) {
        totalSeams++;
        const midX = boxA.x + boxA.w / 2;
        const crossingBox = candidate.find(
          bB => bB.y < bottomEdge && bB.y + bB.h > bottomEdge && bB.x <= midX && bB.x + bB.w >= midX
        );
        if (crossingBox) {
          crossedSeams++;
        }
      }
    }

    if (totalSeams === 0) return 0;
    return Math.min(100, Math.round((crossedSeams / totalSeams) * 100));
  }

  const score180 = evaluateInterlock(rot180);
  const scoreX = evaluateInterlock(mirrorX);
  const scoreY = evaluateInterlock(mirrorY);

  // Pick the candidate that gives the maximum seam crossing
  let bestLayer = rot180;
  let bestType: MosaicPattern['interlockType'] = 'rotacion_180';
  let bestScore = score180;

  if (scoreX > bestScore) {
    bestLayer = mirrorX;
    bestType = 'espejo_horizontal';
    bestScore = scoreX;
  }
  if (scoreY > bestScore) {
    bestLayer = mirrorY;
    bestType = 'espejo_vertical';
    bestScore = scoreY;
  }

  // If score is 0 (e.g. perfectly symmetric pure rectangular column grid), it's columnar stacking
  if (bestScore === 0) {
    bestType = 'apilado_directo';
  }

  return { layerB: bestLayer, interlockType: bestType, score: bestScore };
}

/**
 * Calculates stability label based on score
 */
function getStabilityLabel(score: number): MosaicPattern['interlockStability'] {
  if (score >= 70) return 'Excelente';
  if (score >= 40) return 'Buena';
  if (score > 0) return 'Moderada';
  return 'En columna (Sin traba)';
}

/**
 * Helper to construct a fully enriched MosaicPattern with Cartesian groups and chimney holes
 */
function buildMosaicPattern(
  id: string,
  name: string,
  type: MosaicType,
  description: string,
  layerA: BoxPlacement[],
  PL: number,
  PW: number,
  singleBoxArea: number,
  palletArea: number
): MosaicPattern | null {
  if (layerA.length === 0) return null;

  const { layerB, interlockType, score } = generateCapituladoLayer(layerA, PL, PW);
  const occupied = layerA.length * singleBoxArea;

  const cartesianGroupsA = computeCartesianInfeedGroups(layerA, PL, PW);
  const cartesianGroupsB = computeCartesianInfeedGroups(layerB, PL, PW);
  const chimneyHolesA = detectChimneyHoles(layerA, PL, PW);
  const chimneyHolesB = detectChimneyHoles(layerB, PL, PW);

  const minX = Math.min(...layerA.map(b => b.x));
  const maxX = Math.max(...layerA.map(b => b.x + b.w));
  const minY = Math.min(...layerA.map(b => b.y));
  const maxY = Math.max(...layerA.map(b => b.y + b.h));

  const remainingMarginX = Math.max(0, PL - (maxX - minX));
  const remainingMarginY = Math.max(0, PW - (maxY - minY));

  return {
    id,
    name,
    type,
    description,
    boxesPerLayer: layerA.length,
    layerA,
    layerB,
    areaOccupiedMm2: occupied,
    palletAreaMm2: palletArea,
    areaEfficiency: Math.round((occupied / palletArea) * 1000) / 10,
    remainingMarginX,
    remainingMarginY,
    isInterlockable: score > 0,
    interlockType,
    interlockStability: getStabilityLabel(score),
    stabilityScore: score,
    perimeterFlush: true,
    hasCentralChimney: chimneyHolesA.length > 0 || type === 'molinillo',
    chimneyHolesA,
    chimneyHolesB,
    cartesianGroupsA,
    cartesianGroupsB
  };
}

/**
 * Main Mosaic Calculation Engine
 * Generates all valid geometric layouts on the pallet with 0 overhang.
 */
export function generatePalletMosaics(pallet: PalletDimensions, box: BoxDimensions): MosaicPattern[] {
  const PL = pallet.length; // 1200
  const PW = pallet.width;  // 800 or 1000
  const BL = box.length;    // e.g. 400
  const BW = box.width;     // e.g. 300

  // Quick sanity checks
  if (BL <= 0 || BW <= 0 || PL <= 0 || PW <= 0) {
    return [];
  }
  if ((BL > PL && BL > PW) || (BW > PL && BW > PW)) {
    return [];
  }

  const palletArea = PL * PW;
  const singleBoxArea = BL * BW;
  const rawPatterns: MosaicPattern[] = [];

  // ==========================================
  // PATTERN 1: Puro Longitudinal (Largo en X, Ancho en Y)
  // Perímetro enrasado y holgura centralizada
  // ==========================================
  if (BL <= PL && BW <= PW) {
    const layerA = packCartesianGrid(0, 0, PL, PW, BL, BW, false, 1, 1);
    const pattern = buildMosaicPattern(
      'longitudinal-puro',
      'Mosaico Longitudinal Cartesiano',
      'longitudinal',
      `Disposición perimétrica con cajas a lo largo. Holgura centralizada entre filas/columnas para soporte óptimo en bordes.`,
      layerA,
      PL,
      PW,
      singleBoxArea,
      palletArea
    );
    if (pattern) rawPatterns.push(pattern);
  }

  // ==========================================
  // PATTERN 2: Puro Transversal (Ancho en X, Largo en Y)
  // Perímetro enrasado y holgura centralizada
  // ==========================================
  if (BW <= PL && BL <= PW) {
    const layerA = packCartesianGrid(0, 0, PL, PW, BW, BL, true, 1, 1);
    const pattern = buildMosaicPattern(
      'transversal-puro',
      'Mosaico Transversal Cartesiano',
      'transversal',
      `Disposición perimétrica con cajas a lo ancho. Perímetro sellado y holgura central de ventilación.`,
      layerA,
      PL,
      PW,
      singleBoxArea,
      palletArea
    );
    if (pattern) rawPatterns.push(pattern);
  }

  // ==========================================
  // PATTERN 3: Mixto 2-Bloques Verticales (Corte Vertical)
  // Left block at X in [0..splitX] orientation 1, Right block [splitX..PL] orientation 2
  // ==========================================
  const maxColsL = Math.floor(PL / BL);
  for (let c1 = 1; c1 < maxColsL; c1++) {
    const splitX = c1 * BL;
    const remainingW = PL - splitX;
    if (remainingW >= BW) {
      const leftBoxes = packCartesianGrid(0, 0, splitX, PW, BL, BW, false, 1, 1);
      const rightBoxes = packCartesianGrid(splitX, 0, remainingW, PW, BW, BL, true, leftBoxes.length + 1, 2);
      const layerA = [...leftBoxes, ...rightBoxes];

      const pattern = buildMosaicPattern(
        `mixto-2v-${c1}`,
        `Mosaico Mixto 2 Bloques Cartesiano (${c1} Col. Long. + Bloque Trans.)`,
        'mixto_2bloques_v',
        `División vertical: Bloque izquierdo longitudinal y bloque derecho transversal con perímetro exterior enrasado.`,
        layerA,
        PL,
        PW,
        singleBoxArea,
        palletArea
      );
      if (pattern) rawPatterns.push(pattern);
    }
  }

  // Inverted Vertical Split: Left block Transversal, Right block Longitudinal
  const maxColsW = Math.floor(PL / BW);
  for (let c1 = 1; c1 < maxColsW; c1++) {
    const splitX = c1 * BW;
    const remainingW = PL - splitX;
    if (remainingW >= BL) {
      const leftBoxes = packCartesianGrid(0, 0, splitX, PW, BW, BL, true, 1, 1);
      const rightBoxes = packCartesianGrid(splitX, 0, remainingW, PW, BL, BW, false, leftBoxes.length + 1, 2);
      const layerA = [...leftBoxes, ...rightBoxes];

      const pattern = buildMosaicPattern(
        `mixto-2v-inv-${c1}`,
        `Mosaico Mixto Invertido Cartesiano (${c1} Col. Trans. + Bloque Long.)`,
        'mixto_2bloques_v',
        `División vertical perimétrica con capitulado de alta traba y holgura central.`,
        layerA,
        PL,
        PW,
        singleBoxArea,
        palletArea
      );
      if (pattern) rawPatterns.push(pattern);
    }
  }

  // ==========================================
  // PATTERN 4: Mixto 2-Bloques Horizontales (Corte Horizontal)
  // Bottom block at Y in [0..splitY] orientation 1, Top block orientation 2
  // ==========================================
  const maxRowsW = Math.floor(PW / BW);
  for (let r1 = 1; r1 < maxRowsW; r1++) {
    const splitY = r1 * BW;
    const remainingH = PW - splitY;
    if (remainingH >= BL) {
      const bottomBoxes = packCartesianGrid(0, 0, PL, splitY, BL, BW, false, 1, 1);
      const topBoxes = packCartesianGrid(0, splitY, PL, remainingH, BW, BL, true, bottomBoxes.length + 1, 2);
      const layerA = [...bottomBoxes, ...topBoxes];

      const pattern = buildMosaicPattern(
        `mixto-2h-${r1}`,
        `Mosaico Mixto Horizontal (${r1} Filas Long. + Bloque Trans.)`,
        'mixto_2bloques_h',
        `División horizontal con apoyo completo en los bordes y espacio de ajuste al centro.`,
        layerA,
        PL,
        PW,
        singleBoxArea,
        palletArea
      );
      if (pattern) rawPatterns.push(pattern);
    }
  }

  // ==========================================
  // PATTERN 5: Molinillo / Windmill con Chimenea Central
  // Clásico patrón logístico de alta estabilidad mecánica con hueco interior
  // ==========================================
  {
    const windmillPlacements: BoxPlacement[] = [];
    let curId = 1;

    if (BL + BW <= PL && BL + BW <= PW) {
      // 1. Top-left horizontal box (North-West)
      windmillPlacements.push({ id: curId++, x: 0, y: 0, w: BL, h: BW, rotated: false, blockId: 1 });
      // 2. Top-right vertical box (North-East)
      windmillPlacements.push({ id: curId++, x: PL - BW, y: 0, w: BW, h: BL, rotated: true, blockId: 2 });
      // 3. Bottom-right horizontal box (South-East)
      windmillPlacements.push({ id: curId++, x: PL - BL, y: PW - BW, w: BL, h: BW, rotated: false, blockId: 3 });
      // 4. Bottom-left vertical box (South-West)
      windmillPlacements.push({ id: curId++, x: 0, y: PW - BL, w: BW, h: BL, rotated: true, blockId: 4 });

      // Extend sides if pallet is larger
      let extraX = BL;
      while (extraX + BL <= PL - BW) {
        windmillPlacements.push({ id: curId++, x: extraX, y: 0, w: BL, h: BW, rotated: false, blockId: 1 });
        extraX += BL;
      }
      let extraY = BL;
      while (extraY + BL <= PW - BW) {
        windmillPlacements.push({ id: curId++, x: PL - BW, y: extraY, w: BW, h: BL, rotated: true, blockId: 2 });
        extraY += BL;
      }
      let extraBX = PL - BL - BL;
      while (extraBX >= BW) {
        windmillPlacements.push({ id: curId++, x: extraBX, y: PW - BW, w: BL, h: BW, rotated: false, blockId: 3 });
        extraBX -= BL;
      }
      let extraLY = PW - BL - BL;
      while (extraLY >= BW) {
        windmillPlacements.push({ id: curId++, x: 0, y: extraLY, w: BW, h: BL, rotated: true, blockId: 4 });
        extraLY -= BL;
      }

      // Check inner cavity: in Cartesian palletizing, leave the center chimney as requested!
      // If the inner cavity is large enough for a clean inner block, optionally test a filled variation,
      // but preserve the classic Chimenea Central variant.
      const windmillPattern = buildMosaicPattern(
        'molinillo-chimenea',
        'Mosaico en Molinillo con Chimenea Central',
        'molinillo',
        `Patrón cartesiano perimétrico en molinillo. Cajas enrasadas al exterior y hueco de chimenea central para máxima estabilidad perimetral y aireación.`,
        windmillPlacements,
        PL,
        PW,
        singleBoxArea,
        palletArea
      );
      if (windmillPattern) {
        windmillPattern.stabilityScore = Math.max(90, windmillPattern.stabilityScore);
        windmillPattern.interlockStability = 'Excelente';
        rawPatterns.push(windmillPattern);
      }
    }
  }

  // ==========================================
  // PATTERN 6: Mixto 3-Bloques (1 Columna Izquierda + 2 Bloques Horizontales a la Derecha)
  // ==========================================
  {
    if (BL <= PL && BW <= PW) {
      const colW = BL;
      const remW = PL - colW;
      if (remW >= BW) {
        const leftBoxes = packCartesianGrid(0, 0, colW, PW, BL, BW, false, 1, 1);
        const halfY = Math.floor(PW / 2);
        const splitY = Math.floor(halfY / BL) * BL;
        if (splitY > 0 && PW - splitY >= BW) {
          const topBoxes = packCartesianGrid(colW, 0, remW, splitY, BW, BL, true, leftBoxes.length + 1, 2);
          const bottomBoxes = packCartesianGrid(colW, splitY, remW, PW - splitY, BL, BW, false, leftBoxes.length + topBoxes.length + 1, 3);
          const layerA = [...leftBoxes, ...topBoxes, ...bottomBoxes];

          const pattern = buildMosaicPattern(
            'mixto-3bloques',
            'Mosaico Mixto 3 Secciones Cartesiano',
            'mixto_3bloques',
            `Columna perimétrica de refuerzo combinada con bloques perpendiculares y holguras al interior.`,
            layerA,
            PL,
            PW,
            singleBoxArea,
            palletArea
          );
          if (pattern) rawPatterns.push(pattern);
        }
      }
    }
  }

  // Deduplicate patterns (group by identical box count and layout geometry)
  const uniquePatterns: MosaicPattern[] = [];
  const seenSignatures = new Set<string>();

  for (const p of rawPatterns) {
    if (p.boxesPerLayer <= 0) continue;
    // Generate signature based on sorted box positions
    const sig = `${p.boxesPerLayer}_${p.areaEfficiency}_${p.layerA
      .map(b => `${Math.round(b.x)},${Math.round(b.y)},${b.w},${b.h}`)
      .sort()
      .join(';')}`;

    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniquePatterns.push(p);
    }
  }

  // Sort patterns:
  // 1. Boxes per layer (descending)
  // 2. Area efficiency (descending)
  // 3. Stability score (descending)
  uniquePatterns.sort((a, b) => {
    if (b.boxesPerLayer !== a.boxesPerLayer) {
      return b.boxesPerLayer - a.boxesPerLayer;
    }
    if (b.areaEfficiency !== a.areaEfficiency) {
      return b.areaEfficiency - a.areaEfficiency;
    }
    return b.stabilityScore - a.stabilityScore;
  });

  // Assign 'optimo' tag to the very top layout(s)
  if (uniquePatterns.length > 0) {
    const maxBoxes = uniquePatterns[0].boxesPerLayer;
    uniquePatterns.forEach((p, idx) => {
      if (idx === 0 && p.boxesPerLayer === maxBoxes) {
        p.name = `⭐ ${p.name} (Óptimo Máx. Cajas)`;
      }
    });
  }

  return uniquePatterns;
}

/**
 * Calculates complete pallet metrics given box, pallet, selected mosaic and layers,
 * including center of gravity and tipping stability index.
 */
export function calculatePalletMetrics(
  pallet: PalletDimensions,
  box: BoxDimensions,
  layersCount: number,
  mosaic: MosaicPattern,
  allMosaics: MosaicPattern[]
): {
  totalBoxes: number;
  netWeightKg: number;
  tareWeightKg: number;
  totalWeightKg: number;
  boxHeightTotalMm: number;
  totalHeightMm: number;
  stability: PalletStabilityInfo;
  isOverweightWarning: boolean;
  isOverheightWarning: boolean;
} {
  const totalBoxes = mosaic.boxesPerLayer * layersCount;
  const netWeightKg = Math.round(totalBoxes * box.weight * 10) / 10;
  const tareWeightKg = pallet.tareWeight;
  const totalWeightKg = Math.round((netWeightKg + tareWeightKg) * 10) / 10;
  const boxHeightTotalMm = layersCount * box.height;
  const totalHeightMm = boxHeightTotalMm + pallet.baseHeight;

  // Center of Gravity (CdG) Calculation:
  // Pallet base: mass M_pal, height baseHeight, CdG at baseHeight / 2
  const mPal = pallet.tareWeight;
  const zPal = pallet.baseHeight / 2;

  // Cargo stack: mass M_cargo, stacked from baseHeight to baseHeight + boxHeightTotalMm
  const mCargo = netWeightKg;
  const zCargo = pallet.baseHeight + boxHeightTotalMm / 2;

  // Composite Center of Gravity Height (Z_cdg):
  const totalMass = mPal + mCargo;
  const centerOfGravityHeightMm = totalMass > 0
    ? Math.round(((mPal * zPal + mCargo * zCargo) / totalMass) * 10) / 10
    : Math.round(totalHeightMm / 2);

  const centerOfGravityRatio = totalHeightMm > 0
    ? Math.round((centerOfGravityHeightMm / totalHeightMm) * 1000) / 10
    : 50;

  // Base stability dimension (narrowest axis):
  const minBaseDimensionMm = Math.min(pallet.length, pallet.width); // 800 mm or 1000 mm

  // Slenderness Ratio (Relación de esbeltez λ = Altura / Ancho mínimo)
  const slendernessRatio = Math.round((totalHeightMm / minBaseDimensionMm) * 100) / 100;

  // Critical static tipping angle (Ángulo crítico estático de vuelco en grados):
  // θ_crit = arctan((W_base / 2) / Z_cdg) * (180 / π)
  const staticTippingAngleDeg = centerOfGravityHeightMm > 0
    ? Math.round(Math.atan((minBaseDimensionMm / 2) / centerOfGravityHeightMm) * (180 / Math.PI) * 10) / 10
    : 45;

  // Factors for Composite Stability Index (0 to 100):
  // 1. Tipping Angle factor: Safe threshold is around >= 28 degrees
  const angleScore = Math.min(100, Math.max(0, (staticTippingAngleDeg / 30) * 100));

  // 2. Slenderness factor: 100% if <= 1.2, drops if > 1.2
  const slendernessScore = Math.min(100, Math.max(0, 100 - Math.max(0, slendernessRatio - 1.2) * 55));

  // 3. Mosaic interlock / capitulado factor (0-100)
  const interlockScore = mosaic.stabilityScore;

  // Weighted score: 40% tipping angle, 35% slenderness ratio, 25% traba/capitulado
  const stabilityIndexScore = Math.min(
    100,
    Math.max(10, Math.round(0.40 * angleScore + 0.35 * slendernessScore + 0.25 * interlockScore))
  );

  let stabilityLevel: PalletStabilityInfo['stabilityLevel'] = 'Excelente';
  let recommendation = '';

  if (stabilityIndexScore >= 80) {
    stabilityLevel = 'Excelente';
    recommendation = 'Centro de gravedad bajo y base amplia. Apto para transporte estándar con envoltura de film habitual (2 vueltas de base + coronación).';
  } else if (stabilityIndexScore >= 65) {
    stabilityLevel = 'Estable / Seguro';
    recommendation = 'Buena estabilidad dinámica. Se recomienda enfardado con film estirable de 23 micras (3 vueltas en base y traba superior).';
  } else if (stabilityIndexScore >= 50) {
    stabilityLevel = 'Moderado';
    recommendation = 'Palet esbelto. Obligatorio flejado vertical cruzado o pretensado de film con cordón de refuerzo para evitar desplazamientos en curvas.';
  } else {
    stabilityLevel = 'Crítico (Riesgo Vuelco)';
    recommendation = 'Centro de gravedad muy elevado o relación de esbeltez crítica. Reducir 1 o 2 capas de cajas o asegurar con flejes tensados a la tarima.';
  }

  const stability: PalletStabilityInfo = {
    centerOfGravityHeightMm,
    centerOfGravityRatio,
    slendernessRatio,
    staticTippingAngleDeg,
    stabilityIndexScore,
    stabilityLevel,
    recommendation
  };

  // Logistic warnings:
  // Normal truck height limit is 2.0m to 2.4m, standard pallet height warning at > 1.95m
  // Weight warning: standard pallet limit in retail road transport is ~1000-1200kg
  const isOverweightWarning = totalWeightKg > 1200;
  const isOverheightWarning = totalHeightMm > 1950;

  return {
    totalBoxes,
    netWeightKg,
    tareWeightKg,
    totalWeightKg,
    boxHeightTotalMm,
    totalHeightMm,
    stability,
    isOverweightWarning,
    isOverheightWarning
  };
}
