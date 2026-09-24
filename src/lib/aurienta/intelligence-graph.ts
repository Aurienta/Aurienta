// AURIENTA Intelligence Graph — Blueprint §9 (Intelligence Layer).
//
// A simplified in-memory knowledge graph that materializes the platform's
// relational structure as adjacency lists. Phase 5 will replace this with a
// Neo4j deployment (per the blueprint's Intelligence Graph specification) —
// the function signatures here are designed to be Neo4j-portable.
//
// Node types: enterprise, user, proposal, milestone, trade, ledger_event
// Edge types:
//   OWNS          — user → enterprise     (OwnershipRecord)
//   MEMBER_OF     — user → enterprise     (EnterpriseMember)
//   VOTED_ON      — user → proposal       (Vote)
//   FUNDED        — user → enterprise     (confirmed Reservation)
//                  OR trade → enterprise  (matched Trade, capital flow)
//   GRADUATED_FROM — enterprise → AURIENTA platform pseudo-node
//                            (stage === "graduated")
//
// The graph is built fresh at query time from the existing db. No new tables
// are introduced — this is a read-only projection over the existing schema.

import { db } from "@/lib/db";

export type NodeType =
  | "enterprise"
  | "user"
  | "proposal"
  | "milestone"
  | "trade"
  | "ledger_event"
  | "platform";

export type EdgeType =
  | "OWNS"
  | "MEMBER_OF"
  | "VOTED_ON"
  | "FUNDED"
  | "GRADUATED_FROM";

export type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  data?: Record<string, unknown>;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: EdgeType;
  weight?: number;
  data?: Record<string, unknown>;
};

export type Graph = {
  nodes: Map<string, GraphNode>;
  out: Map<string, GraphEdge[]>; // node id → outgoing edges
  in: Map<string, GraphEdge[]>;  // node id → incoming edges
};

// Pseudo-node id for the AURIENTA platform — used as the target of
// GRADUATED_FROM edges. Stays constant so queries are deterministic.
export const PLATFORM_NODE_ID = "aurienta:platform";

// ── Build the graph from the db ──
// Pulls a bounded snapshot (last 500 trades + last 500 ledger events, all
// enterprises/users/proposals/milestones) so the in-memory footprint stays
// predictable. For sandboxes with few rows this returns the full graph.
export async function buildGraph(): Promise<Graph> {
  const g: Graph = {
    nodes: new Map(),
    out: new Map(),
    in: new Map(),
  };

  function addNode(n: GraphNode): void {
    if (!g.nodes.has(n.id)) g.nodes.set(n.id, n);
  }
  function addEdge(e: GraphEdge): void {
    if (!g.out.has(e.source)) g.out.set(e.source, []);
    if (!g.in.has(e.target)) g.in.set(e.target, []);
    const outList = g.out.get(e.source);
    const inList = g.in.get(e.target);
    if (outList) outList.push(e);
    if (inList) inList.push(e);
  }

  // Platform pseudo-node (target of GRADUATED_FROM edges).
  addNode({
    id: PLATFORM_NODE_ID,
    type: "platform",
    label: "AURIENTA Platform",
  });

  // ── Enterprises ──
  const enterprises = await db.enterprise.findMany({
    select: {
      id: true, name: true, tier: true, sector: true, stage: true, status: true,
      raisedEgp: true, totalEquityUnits: true, founderId: true,
    },
  });
  for (const e of enterprises) {
    addNode({
      id: `enterprise:${e.id}`,
      type: "enterprise",
      label: e.name,
      data: { tier: e.tier, sector: e.sector, stage: e.stage, status: e.status },
    });
    if (e.stage === "graduated" || e.status === "graduated") {
      addEdge({
        source: `enterprise:${e.id}`,
        target: PLATFORM_NODE_ID,
        type: "GRADUATED_FROM",
      });
    }
  }

  // ── Users ──
  const users = await db.user.findMany({
    select: {
      id: true, legalName: true, tier: true, primaryIntent: true,
      sovereignTrustScore: true,
    },
  });
  for (const u of users) {
    addNode({
      id: `user:${u.id}`,
      type: "user",
      label: u.legalName,
      data: {
        tier: u.tier,
        primaryIntent: u.primaryIntent,
        sts: u.sovereignTrustScore,
      },
    });
  }

  // ── Ownership (OWNS edges) ──
  const ownership = await db.ownershipRecord.findMany({
    select: { userId: true, enterpriseId: true, equityUnits: true, avgPriceEgp: true },
  });
  for (const o of ownership) {
    addEdge({
      source: `user:${o.userId}`,
      target: `enterprise:${o.enterpriseId}`,
      type: "OWNS",
      weight: o.equityUnits,
      data: { equityUnits: o.equityUnits, avgPriceEgp: o.avgPriceEgp },
    });
  }

  // ── Memberships (MEMBER_OF edges) ──
  const members = await db.enterpriseMember.findMany({
    select: { userId: true, enterpriseId: true, role: true, boardSeat: true },
  });
  for (const m of members) {
    addEdge({
      source: `user:${m.userId}`,
      target: `enterprise:${m.enterpriseId}`,
      type: "MEMBER_OF",
      data: { role: m.role, boardSeat: m.boardSeat },
    });
  }

  // ── Proposals + Votes (VOTED_ON edges) ──
  const proposals = await db.proposal.findMany({
    select: {
      id: true, enterpriseId: true, title: true, type: true, status: true,
      votesFor: true, votesAgainst: true, votesAbstain: true,
    },
  });
  for (const p of proposals) {
    addNode({
      id: `proposal:${p.id}`,
      type: "proposal",
      label: p.title,
      data: {
        type: p.type,
        status: p.status,
        enterpriseId: p.enterpriseId,
        votesFor: p.votesFor,
        votesAgainst: p.votesAgainst,
        votesAbstain: p.votesAbstain,
      },
    });
    // Proposal belongs to an enterprise (proposal → enterprise via MEMBER_OF-style).
    // We model this as a FUNDED edge (a proposal funds operations/milestones).
    addEdge({
      source: `proposal:${p.id}`,
      target: `enterprise:${p.enterpriseId}`,
      type: "FUNDED",
    });
  }

  const votes = await db.vote.findMany({
    select: { userId: true, proposalId: true, choice: true, votingPower: true },
  });
  for (const v of votes) {
    addEdge({
      source: `user:${v.userId}`,
      target: `proposal:${v.proposalId}`,
      type: "VOTED_ON",
      weight: v.votingPower,
      data: { choice: v.choice, votingPower: v.votingPower },
    });
  }

  // ── Milestones (FUNDED via milestone releases) ──
  const milestones = await db.milestone.findMany({
    select: {
      id: true, enterpriseId: true, title: true, status: true, amountEgp: true,
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });
  for (const m of milestones) {
    addNode({
      id: `milestone:${m.id}`,
      type: "milestone",
      label: m.title,
      data: { enterpriseId: m.enterpriseId, status: m.status, amountEgp: m.amountEgp },
    });
    addEdge({
      source: `milestone:${m.id}`,
      target: `enterprise:${m.enterpriseId}`,
      type: "FUNDED",
      weight: m.amountEgp,
    });
  }

  // ── Trades (FUNDED via secondary-market capital flow) ──
  const trades = await db.trade.findMany({
    select: {
      id: true, enterpriseId: true, buyerId: true, sellerId: true,
      grossEgp: true, equityUnits: true, matchedAt: true,
    },
    take: 500,
    orderBy: { matchedAt: "desc" },
  });
  for (const t of trades) {
    addNode({
      id: `trade:${t.id}`,
      type: "trade",
      label: `Trade ${t.equityUnits} @ ${t.grossEgp.toFixed(0)} EGP`,
      data: {
        enterpriseId: t.enterpriseId,
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        grossEgp: t.grossEgp,
        equityUnits: t.equityUnits,
      },
    });
    // Trade funds the enterprise's secondary-market liquidity.
    addEdge({
      source: `trade:${t.id}`,
      target: `enterprise:${t.enterpriseId}`,
      type: "FUNDED",
      weight: t.grossEgp,
    });
    // Buyer + seller connect to the trade for traceability.
    addEdge({
      source: `user:${t.buyerId}`,
      target: `trade:${t.id}`,
      type: "FUNDED",
      weight: t.grossEgp,
      data: { role: "buyer" },
    });
    addEdge({
      source: `user:${t.sellerId}`,
      target: `trade:${t.id}`,
      type: "FUNDED",
      weight: t.grossEgp,
      data: { role: "seller" },
    });
  }

  // ── Ledger events (the immutable hash chain) ──
  // Each LedgerEvent is a node; its enterprise is the FUNDED target. We do
  // not chain ledger_event nodes to each other here — the chain integrity is
  // verified by verifyLedgerChain() in cre.ts. The graph surfaces them so the
  // intel layer can join ledger events to other entities.
  const ledger = await db.ledgerEvent.findMany({
    select: { id: true, enterpriseId: true, eventType: true, sequence: true, timestamp: true },
    take: 500,
    orderBy: { timestamp: "desc" },
  });
  for (const ev of ledger) {
    addNode({
      id: `ledger_event:${ev.id}`,
      type: "ledger_event",
      label: `${ev.eventType} #${ev.sequence}`,
      data: {
        enterpriseId: ev.enterpriseId,
        eventType: ev.eventType,
        sequence: ev.sequence,
        timestamp: ev.timestamp.toISOString(),
      },
    });
    if (ev.enterpriseId) {
      addEdge({
        source: `ledger_event:${ev.id}`,
        target: `enterprise:${ev.enterpriseId}`,
        type: "FUNDED",
        weight: ev.sequence,
      });
    }
  }

  return g;
}

// ── Query the graph ──
// Supports three query modes:
//   1. neighborhood(start: nodeId, hops: 1|2) — BFS subgraph around a node
//   2. filter(byType, byEdgeType) — return nodes matching filters
//   3. path(from, to) — BFS shortest path (returns the path as a node list)
export type GraphQuery =
  | { kind: "neighborhood"; start: string; hops?: 1 | 2 }
  | { kind: "filter"; nodeType?: NodeType; edgeType?: EdgeType }
  | { kind: "path"; from: string; to: string };

export type GraphQueryResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  // For "path" queries only — ordered list of node ids from `from` to `to`.
  path?: string[];
};

export async function queryGraph(query: GraphQuery): Promise<GraphQueryResult> {
  const g = await buildGraph();

  if (query.kind === "neighborhood") {
    const start = query.start;
    const hops = query.hops ?? 1;
    if (!g.nodes.has(start)) {
      return { nodes: [], edges: [] };
    }
    const visitedNodes = new Set<string>([start]);
    const collectedEdges: GraphEdge[] = [];
    const frontier: string[] = [start];
    for (let h = 0; h < hops; h++) {
      const next: string[] = [];
      for (const n of frontier) {
        const outs = g.out.get(n) ?? [];
        const ins = g.in.get(n) ?? [];
        for (const e of [...outs, ...ins]) {
          collectedEdges.push(e);
          const other = e.source === n ? e.target : e.source;
          if (!visitedNodes.has(other)) {
            visitedNodes.add(other);
            next.push(other);
          }
        }
      }
      frontier.length = 0;
      frontier.push(...next);
    }
    const nodes: GraphNode[] = [];
    for (const id of visitedNodes) {
      const node = g.nodes.get(id);
      if (node) nodes.push(node);
    }
    return { nodes, edges: dedupeEdges(collectedEdges) };
  }

  if (query.kind === "filter") {
    const nodes: GraphNode[] = [];
    for (const n of g.nodes.values()) {
      if (query.nodeType && n.type !== query.nodeType) continue;
      nodes.push(n);
    }
    const edges: GraphEdge[] = [];
    if (query.edgeType) {
      for (const edgeList of g.out.values()) {
        for (const e of edgeList) {
          if (e.type === query.edgeType) edges.push(e);
        }
      }
    }
    return { nodes, edges: dedupeEdges(edges) };
  }

  // BFS shortest path
  const from = query.from;
  const to = query.to;
  if (!g.nodes.has(from) || !g.nodes.has(to)) {
    return { nodes: [], edges: [], path: [] };
  }
  if (from === to) {
    const startNode = g.nodes.get(from);
    return {
      nodes: startNode ? [startNode] : [],
      edges: [],
      path: [from],
    };
  }
  const queue: string[] = [from];
  const cameFrom = new Map<string, string | null>([[from, null]]);
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    const neighbors: string[] = [];
    for (const e of g.out.get(cur) ?? []) neighbors.push(e.target);
    for (const e of g.in.get(cur) ?? []) neighbors.push(e.source);
    for (const next of neighbors) {
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, cur);
      if (next === to) {
        // Reconstruct path
        const path: string[] = [];
        let n: string | null = to;
        while (n) {
          path.unshift(n);
          n = cameFrom.get(n) ?? null;
        }
        const pathNodes: GraphNode[] = [];
        for (const id of path) {
          const node = g.nodes.get(id);
          if (node) pathNodes.push(node);
        }
        // Collect the edges that make up the path
        const pathEdges: GraphEdge[] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const outs = g.out.get(path[i]) ?? [];
          const match = outs.find((e) => e.target === path[i + 1]);
          if (match) pathEdges.push(match);
          else {
            const ins = g.in.get(path[i]) ?? [];
            const matchIn = ins.find((e) => e.source === path[i + 1]);
            if (matchIn) pathEdges.push(matchIn);
          }
        }
        return { nodes: pathNodes, edges: pathEdges, path };
      }
      queue.push(next);
    }
  }
  return { nodes: [], edges: [], path: [] };
}

// ── Get the 1-hop neighborhood around an enterprise ──
// Returns all users who own/member-of the enterprise, all proposals,
// milestones, trades, and ledger events tied to it, plus any GRADUATED_FROM
// edge if the enterprise has graduated.
export async function getEnterpriseNetwork(
  enterpriseId: string
): Promise<GraphQueryResult> {
  return queryGraph({
    kind: "neighborhood",
    start: `enterprise:${enterpriseId}`,
    hops: 1,
  });
}

// ── Get the 1-hop neighborhood around a user ──
// Returns all enterprises the user owns or is a member of, all proposals
// they voted on, and all trades they participated in.
export async function getUserNetwork(
  userId: string
): Promise<GraphQueryResult> {
  return queryGraph({
    kind: "neighborhood",
    start: `user:${userId}`,
    hops: 1,
  });
}

// ── Edge deduplication (a Map<edgeKey, GraphEdge> would be simpler but
// the function is only used internally for query results — keep it small). ──
function dedupeEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  const out: GraphEdge[] = [];
  for (const e of edges) {
    const key = `${e.source}|${e.target}|${e.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

// ── Conflict-of-Interest Detection (Vol 11 §11.1.4) ──
// Detects when a user has undisclosed relationships that could bias their
// decisions in an enterprise. The CRE uses this to block related-party
// transactions and require disclosure before voting.

export type ConflictOfInterest = {
  userId: string;
  enterpriseId: string;
  conflictType:
    | "ownership_overlap" // user owns shares in both enterprises that transact
    | "family_relationship" // user has a family member in the counterparty enterprise
    | "dual_role" // user is both a manager and a board member of different enterprises
    | "financial_dependency" // user receives income from the counterparty
    | "undisclosed_relation"; // found a relation not declared in the conflict registry
  severity: "low" | "medium" | "high";
  detail: string;
  relatedEnterpriseId?: string;
  relatedUserId?: string;
  detectedAt: Date;
};

/**
 * Detect conflicts of interest for a user in the context of an enterprise.
 * Queries the intelligence graph for overlapping relationships.
 */
export async function detectConflictsOfInterest(
  userId: string,
  enterpriseId: string
): Promise<ConflictOfInterest[]> {
  const conflicts: ConflictOfInterest[] = [];

  // 1. Ownership overlap: does this user own shares in enterprises that
  //    transact with the target enterprise?
  const userOwnerships = await (db as any).ownershipRecord.findMany({
    where: { userId },
    include: { enterprise: { select: { id: true, name: true } } },
  });

  for (const ownership of userOwnerships) {
    if (ownership.enterpriseId === enterpriseId) continue;

    // Check if there are trades between this enterprise and the target
    // (Trades only have a single enterpriseId, so we check trades where the
    // buyer or seller is from the related enterprise)
    const tradesBetween = await (db as any).trade.findMany({
      where: {
        OR: [
          { enterpriseId: ownership.enterpriseId, buyerId: userId },
          { enterpriseId: enterpriseId, buyerId: userId },
        ],
      },
      take: 5,
    });

    if (tradesBetween.length > 0) {
      conflicts.push({
        userId,
        enterpriseId,
        conflictType: "ownership_overlap",
        severity: "high",
        detail: `User owns shares in ${ownership.enterprise.name} which has ${tradesBetween.length} trade(s) with this enterprise. Related-party transaction disclosure required.`,
        relatedEnterpriseId: ownership.enterpriseId,
        detectedAt: new Date(),
      });
    }
  }

  // 2. Dual role: is the user a manager in one enterprise and a board member
  //    in another that transacts with the target?
  const userMemberships = await (db as any).enterpriseMember.findMany({
    where: { userId },
    include: { enterprise: { select: { id: true, name: true } } },
  });

  const managerRoles = userMemberships.filter((m: any) => m.role === "manager");
  const boardRoles = userMemberships.filter((m: any) => m.role === "board_member");

  if (managerRoles.length > 0 && boardRoles.length > 0) {
    conflicts.push({
      userId,
      enterpriseId,
      conflictType: "dual_role",
      severity: "medium",
      detail: `User is a manager in ${managerRoles.length} enterprise(s) and a board member in ${boardRoles.length} enterprise(s). This dual role may create conflicts in governance decisions.`,
      detectedAt: new Date(),
    });
  }

  // 3. Financial dependency: does the user receive salary from multiple enterprises?
  const userEmployments = await (db as any).employee.findMany({
    where: { userId },
    select: { enterpriseId: true, monthlySalaryEgp: true },
  });

  if (userEmployments.length > 1) {
    conflicts.push({
      userId,
      enterpriseId,
      conflictType: "financial_dependency",
      severity: "medium",
      detail: `User receives income from ${userEmployments.length} enterprises. Financial dependency may bias decisions.`,
      detectedAt: new Date(),
    });
  }

  // 4. Family relationship: check the succession declarations for family
  //    beneficiaries who might be members of counterparty enterprises.
  //    (Simplified: check if any beneficiary name matches other users.)
  const successionDeclarations = await (db as any).successionDeclaration.findMany({
    where: { userId },
    select: { beneficiaryName: true, beneficiaryUserId: true },
  });

  for (const decl of successionDeclarations) {
    if (!decl.beneficiaryName) continue;
    // Check if any enterprise member has a similar name
    const firstName = decl.beneficiaryName.split(" ")[0] ?? "";
    if (!firstName || firstName.length < 3) continue;
    const matchingMembers = await (db as any).enterpriseMember.findMany({
      where: {
        enterpriseId: { not: enterpriseId },
        user: { legalName: { contains: firstName } },
      },
      take: 3,
      include: { user: { select: { legalName: true, id: true } } },
    });

    for (const match of matchingMembers) {
      conflicts.push({
        userId,
        enterpriseId,
        conflictType: "family_relationship",
        severity: "high",
        detail: `User's succession beneficiary "${decl.beneficiaryName}" may be related to enterprise member "${match.user.legalName}" in another enterprise.`,
        relatedUserId: match.user.id,
        relatedEnterpriseId: match.enterpriseId,
        detectedAt: new Date(),
      });
    }
  }

  return conflicts;
}

/**
 * Check if a user has an active conflict-of-interest declaration.
 * Returns true if the user has disclosed all detected conflicts.
 */
export async function hasActiveCoiDeclaration(
  userId: string,
  enterpriseId: string
): Promise<{ hasDeclaration: boolean; undisclosedConflicts: ConflictOfInterest[] }> {
  const conflicts = await detectConflictsOfInterest(userId, enterpriseId);

  // Check if the user has filed a conflict-of-interest declaration
  // for this enterprise (stored in the audit log)
  const declarations = await db.auditLog.findMany({
    where: {
      actorId: userId,
      action: "coi.declaration_filed",
      target: `enterprise:${enterpriseId}`,
    },
    orderBy: { timestamp: "desc" },
    take: 1,
  });

  if (declarations.length === 0 && conflicts.length > 0) {
    return {
      hasDeclaration: false,
      undisclosedConflicts: conflicts,
    };
  }

  return {
    hasDeclaration: true,
    undisclosedConflicts: [],
  };
}
