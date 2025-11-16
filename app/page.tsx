'use client'

import { useState, useRef, useEffect } from 'react'

interface Node {
  id: string
  x: number
  y: number
  text: string
  parentId: string | null
}

interface Connection {
  from: string
  to: string
}

export default function Canvas() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', x: 400, y: 300, text: '', parentId: null }
  ])
  const [connections, setConnections] = useState<Connection[]>([])
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const createBranch = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId)
    if (!parent) return

    const newId = Date.now().toString()
    const newNode: Node = {
      id: newId,
      x: parent.x + 250,
      y: parent.y + (Math.random() - 0.5) * 100,
      text: '',
      parentId: parentId
    }

    setNodes([...nodes, newNode])
    setConnections([...connections, { from: parentId, to: newId }])
  }

  const updateNodeText = (id: string, text: string) => {
    setNodes(nodes.map(node =>
      node.id === id ? { ...node, text } : node
    ))
  }

  const deleteNode = (id: string) => {
    const childNodes = nodes.filter(n => n.parentId === id).map(n => n.id)
    const nodesToDelete = [id, ...childNodes]

    setNodes(nodes.filter(n => !nodesToDelete.includes(n.id)))
    setConnections(connections.filter(c =>
      !nodesToDelete.includes(c.from) && !nodesToDelete.includes(c.to)
    ))
  }

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return

    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setDraggingNode(nodeId)
      setDragOffset({
        x: e.clientX - node.x - panOffset.x,
        y: e.clientY - node.y - panOffset.y
      })
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode)
      if (node) {
        setNodes(nodes.map(n =>
          n.id === draggingNode
            ? { ...n, x: e.clientX - dragOffset.x - panOffset.x, y: e.clientY - dragOffset.y - panOffset.y }
            : n
        ))
      }
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setDraggingNode(null)
    setIsPanning(false)
  }

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab',
        background: '#1a1a1a'
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {connections.map((conn, idx) => {
          const from = nodes.find(n => n.id === conn.from)
          const to = nodes.find(n => n.id === conn.to)
          if (!from || !to) return null

          return (
            <line
              key={idx}
              x1={from.x + 150 + panOffset.x}
              y1={from.y + 75 + panOffset.y}
              x2={to.x + panOffset.x}
              y2={to.y + 75 + panOffset.y}
              stroke="#4a90e2"
              strokeWidth="2"
            />
          )
        })}
      </svg>

      {nodes.map(node => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: node.x + panOffset.x,
            top: node.y + panOffset.y,
            width: '300px',
            background: '#2d2d2d',
            border: '2px solid #4a90e2',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'move',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
        >
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>
              Node {node.id}
            </span>
            {node.id !== '1' && (
              <button
                onClick={() => deleteNode(node.id)}
                style={{
                  background: '#d9534f',
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Delete
              </button>
            )}
          </div>
          <textarea
            value={node.text}
            onChange={(e) => updateNodeText(node.id, e.target.value)}
            placeholder="Type your prompt here..."
            style={{
              width: '100%',
              minHeight: '100px',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              padding: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '8px'
            }}
          />
          <button
            onClick={() => createBranch(node.id)}
            style={{
              width: '100%',
              background: '#4a90e2',
              border: 'none',
              color: 'white',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            + Create Branch
          </button>
        </div>
      ))}

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#aaa',
        zIndex: 100
      }}>
        <div><strong>Controls:</strong></div>
        <div>• Drag nodes to move them</div>
        <div>• Drag canvas to pan</div>
        <div>• Click "Create Branch" to add child nodes</div>
      </div>
    </div>
  )
}
