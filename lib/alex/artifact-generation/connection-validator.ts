/**
 * Connection Validator
 * 
 * Validates and auto-fixes n8n workflow JSON connections.
 * Ensures every node is properly wired — no orphan or dangling nodes.
 */

export class ConnectionValidator {

  /**
   * Validate that all nodes in the workflow are connected.
   * Auto-fixes simple issues (orphan respondToWebhook, dangling references).
   * Returns { fixed, issues } where issues is a human-readable log.
   */
  static validateAndFix(workflow: any): { fixed: boolean; issues: string[] } {
    let fixed = false
    const issues: string[] = []

    if (!workflow || !workflow.nodes || !Array.isArray(workflow.nodes) || !workflow.connections) {
      issues.push('Invalid workflow structure — missing nodes or connections.')
      return { fixed, issues }
    }

    const nodeNames = new Set<string>(workflow.nodes.map((n: any) => String(n.name)))

    // ── 1. Collect every node that appears in any connection ──
    const connectedNodes = new Set<string>()

    for (const sourceNode in workflow.connections) {
      connectedNodes.add(String(sourceNode))
      const outputs = workflow.connections[sourceNode]
      for (const outputType in outputs) {
        const branches = outputs[outputType]
        if (Array.isArray(branches)) {
          for (const branch of branches) {
            if (Array.isArray(branch)) {
              for (const target of branch) {
                if (target && target.node) {
                  connectedNodes.add(String(target.node))
                }
              }
            }
          }
        }
      }
    }

    // ── 2. Detect orphan nodes ──
    const orphans = Array.from(nodeNames).filter(name => !connectedNodes.has(name))

    if (orphans.length > 0) {
      issues.push(`Found ${orphans.length} orphan node(s): ${orphans.join(', ')}`)

      // Auto-fix: try to attach each orphan to the workflow
      for (const orphanName of orphans) {
        const orphanNode = workflow.nodes.find((n: any) => n.name === orphanName)
        if (!orphanNode) continue

        const orphanType: string = orphanNode.type || ''

        // Case A: orphan is a respondToWebhook → attach it after the last leaf node
        if (orphanType === 'n8n-nodes-base.respondToWebhook') {
          const leaf = this.findLeafNode(workflow, connectedNodes)
          if (leaf) {
            this.addConnection(workflow, leaf, orphanName, 'main')
            connectedNodes.add(orphanName)
            fixed = true
            issues.push(`Auto-fixed: connected orphan '${orphanName}' after leaf '${leaf}'.`)
            continue
          }
        }

        // Case B: orphan is an AI model node → connect via ai_languageModel to a chain/agent
        if (orphanType.includes('lmChat') || orphanType.includes('lmChatGoogle') || orphanType.includes('lmChatOpenAi')) {
          const agentOrChain = workflow.nodes.find((n: any) =>
            n.type?.includes('chainLlm') || n.type?.includes('.agent')
          )
          if (agentOrChain) {
            this.addConnection(workflow, orphanName, agentOrChain.name, 'ai_languageModel')
            connectedNodes.add(orphanName)
            fixed = true
            issues.push(`Auto-fixed: connected AI model '${orphanName}' to '${agentOrChain.name}' via ai_languageModel.`)
            continue
          }
        }

        // Case C: orphan is a trigger → it should be the start; attach to first non-trigger node
        if (orphanType.includes('Trigger') || orphanType.includes('trigger')) {
          const firstNonTrigger = workflow.nodes.find((n: any) =>
            n.name !== orphanName && !(n.type || '').toLowerCase().includes('trigger')
          )
          if (firstNonTrigger) {
            this.addConnection(workflow, orphanName, firstNonTrigger.name, 'main')
            connectedNodes.add(orphanName)
            fixed = true
            issues.push(`Auto-fixed: connected trigger '${orphanName}' to '${firstNonTrigger.name}'.`)
            continue
          }
        }

        // Case D: generic orphan → attach after last leaf
        const leaf = this.findLeafNode(workflow, connectedNodes)
        if (leaf) {
          this.addConnection(workflow, leaf, orphanName, 'main')
          connectedNodes.add(orphanName)
          fixed = true
          issues.push(`Auto-fixed: connected orphan '${orphanName}' after leaf '${leaf}'.`)
        }
      }
    }

    // ── 3. Remove connections pointing to non-existent nodes ──
    for (const sourceNode in workflow.connections) {
      // If the source node doesn't exist, delete the whole entry
      if (!nodeNames.has(sourceNode)) {
        issues.push(`Removed connections from non-existent source '${sourceNode}'.`)
        delete workflow.connections[sourceNode]
        fixed = true
        continue
      }

      const outputs = workflow.connections[sourceNode]
      for (const outputType in outputs) {
        const branches = outputs[outputType]
        if (Array.isArray(branches)) {
          for (const branch of branches) {
            if (Array.isArray(branch)) {
              for (let i = branch.length - 1; i >= 0; i--) {
                const targetName = branch[i]?.node
                if (targetName && !nodeNames.has(targetName)) {
                  issues.push(`Removed invalid connection: '${sourceNode}' → '${targetName}' (node does not exist).`)
                  branch.splice(i, 1)
                  fixed = true
                }
              }
            }
          }
        }
      }
    }

    // ── 4. Verify chain continuity (no broken chains) ──
    // Walk from every trigger → downstream and check for dead ends mid-chain
    const triggerNodes = workflow.nodes.filter((n: any) =>
      (n.type || '').toLowerCase().includes('trigger')
    )

    for (const trigger of triggerNodes) {
      const visited = new Set<string>()
      const queue = [trigger.name]
      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)

        const conns = workflow.connections[current]
        if (conns) {
          for (const outputType in conns) {
            const branches = conns[outputType]
            if (Array.isArray(branches)) {
              for (const branch of branches) {
                if (Array.isArray(branch)) {
                  for (const target of branch) {
                    if (target?.node && !visited.has(target.node)) {
                      queue.push(target.node)
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Nodes not reachable from this trigger (excluding AI model nodes which connect via ai_languageModel)
      const unreachable = Array.from(nodeNames).filter(name => {
        if (visited.has(name)) return false
        const node = workflow.nodes.find((n: any) => n.name === name)
        // AI model nodes are sub-nodes, not in main flow
        if (node?.type?.includes('lmChat')) return false
        // Other triggers are separate entry points
        if (node?.type?.toLowerCase().includes('trigger') && name !== trigger.name) return false
        return true
      })

      if (unreachable.length > 0) {
        issues.push(`Nodes unreachable from trigger '${trigger.name}': ${unreachable.join(', ')}`)
      }
    }

    if (issues.length === 0) {
      issues.push('All nodes are properly connected. ✅')
    }

    return { fixed, issues }
  }

  /**
   * Find a leaf node — a node that appears as a target but NOT as a source.
   */
  private static findLeafNode(workflow: any, connectedNodes: Set<string>): string | null {
    const sources = new Set(Object.keys(workflow.connections))
    const leaves = Array.from(connectedNodes).filter(name => {
      if (sources.has(name)) return false
      // Exclude AI model sub-nodes
      const node = workflow.nodes.find((n: any) => n.name === name)
      if (node?.type?.includes('lmChat')) return false
      return true
    })
    return leaves.length > 0 ? leaves[leaves.length - 1] : null
  }

  /**
   * Add a connection between two nodes.
   */
  private static addConnection(
    workflow: any,
    fromNode: string,
    toNode: string,
    connectionType: string
  ): void {
    if (!workflow.connections[fromNode]) {
      workflow.connections[fromNode] = {}
    }
    if (!workflow.connections[fromNode][connectionType]) {
      workflow.connections[fromNode][connectionType] = [[]]
    }
    const branches = workflow.connections[fromNode][connectionType]
    if (branches.length === 0) {
      branches.push([])
    }
    branches[0].push({ node: toNode, type: connectionType, index: 0 })
  }
}
