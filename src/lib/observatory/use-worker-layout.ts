/**
 * useWorkerLayout — React hook bridging the Web Worker layout engine and R3F.
 *
 * Section 2.4 of the Observatory 3D Rendering Architecture.
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { LayoutConfig, LayoutResult } from './worker-layout'

interface WorkerNode {
  id: string
  mass: number
}

interface WorkerEdge {
  source: string
  target: string
  weight: number
}

interface UseWorkerLayoutReturn {
  positionsRef: React.MutableRefObject<Float32Array>
  converged: boolean
  iteration: number
  restart: () => void
}

/**
 * Offloads force-directed layout to a Web Worker.
 *
 * Returns a ref to the positions Float32Array that is updated on each tick.
 * useFrame in the consuming component reads the ref each frame (zero-copy read).
 */
export function useWorkerLayout(
  nodes: WorkerNode[],
  edges: WorkerEdge[],
  config?: Partial<LayoutConfig>,
): UseWorkerLayoutReturn {
  const workerRef = useRef<Worker | null>(null)
  const positionsRef = useRef<Float32Array>(new Float32Array(nodes.length * 3))
  const [converged, setConverged] = useState(false)
  const [iteration, setIteration] = useState(0)
  const tickingRef = useRef(false)

  // Build index maps for edge source/target → node indices
  const nodeIndexMap = useRef(new Map<string, number>())

  const initWorker = useCallback(() => {
    // Build node index map
    const indexMap = new Map<string, number>()
    nodes.forEach((n, i) => indexMap.set(n.id, i))
    nodeIndexMap.current = indexMap

    // Convert edges to index-based
    const indexedEdges = edges
      .map((e) => ({
        source: indexMap.get(e.source) ?? -1,
        target: indexMap.get(e.target) ?? -1,
        weight: e.weight,
      }))
      .filter((e) => e.source !== -1 && e.target !== -1)

    // Create worker
    const worker = new Worker(
      new URL('./worker-layout.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (e: MessageEvent<LayoutResult>) => {
      const result = e.data
      if (result.type === 'positions') {
        positionsRef.current = result.positions
        setIteration(result.iteration)

        if (result.converged) {
          setConverged(true)
          tickingRef.current = false
        } else if (tickingRef.current) {
          // Request next tick
          worker.postMessage({ type: 'tick' })
        }
      }
    }

    // Initialize
    worker.postMessage({
      type: 'init',
      nodes: nodes.map((n) => ({ id: n.id, mass: n.mass })),
      edges: indexedEdges,
      config,
    })

    tickingRef.current = true
    setConverged(false)
    setIteration(0)

    return worker
  }, [nodes, edges, config])

  useEffect(() => {
    if (nodes.length === 0) return

    const worker = initWorker()
    workerRef.current = worker

    return () => {
      tickingRef.current = false
      worker.terminate()
      workerRef.current = null
    }
  }, [initWorker, nodes.length])

  const restart = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }
    const worker = initWorker()
    workerRef.current = worker
  }, [initWorker])

  return { positionsRef, converged, iteration, restart }
}
