# Teaching Technical Subjects and Computer Science

## The ten questions for any algorithm, protocol or system

Weave the answers into the lesson's narrative; don't print them as a checklist.

1. **What problem does it solve?** Concretely: what goes wrong without it?
2. **Why does that problem exist?** What physical, mathematical or economic constraint creates it (disks read pages, light is finite-speed, networks drop packets, memory is smaller than data)?
3. **How was it solved before?** The naive or historical approach.
4. **What limited that approach?** Show the failure *quantitatively* (O(n²) on a million items is 10¹² operations; the 1986 congestion collapses cut some throughput by roughly a factor of a thousand).
5. **What's the key intuition** of the new approach? The single observation that saves the day.
6. **How does it work?** Step by step, traced on a small realistic input.
7. **What are the mathematical foundations?** Complexity, correctness argument or invariant, probability model, control-theoretic behaviour.
8. **How does it behave in reality?** Real numbers: constants, cache effects, typical workloads, what the profiler shows.
9. **What are its limitations?** Adversarial inputs, assumptions that break, scaling limits.
10. **What are the alternatives,** and when would you choose each?

## Tracing as the core teaching move

For algorithms, the "worked example" is a trace: a small but meaningful input, with the state shown after each step (a table, a sequence of array states, an ASCII tree, a timeline of packets). Choose the input to exercise the interesting case: the rotation in an AVL insert, the hash collision, the packet loss.

## Correctness and invariants

Students often understand *what* an algorithm does without knowing *why it's right*. State the invariant ("after the i-th pass, the last i elements are in final position"; "every node in the left subtree is smaller"), show it holds initially, show each step preserves it, and show it implies the result at termination. This is induction in disguise; say so.

## Domain notes

**Algorithms and data structures.** Cost models matter: say whether you're counting comparisons, memory accesses or I/Os. Distinguish worst, average and amortised cost (dynamic array doubling is the classic amortised story). Connect asymptotic analysis to wall-clock reality: constants, cache-friendliness, and why quicksort often beats heapsort despite the same O(n log n) average.

**Operating systems.** Everything is a response to sharing scarce hardware among programs that don't trust each other. Processes/threads, scheduling (fairness vs. latency vs. throughput), virtual memory (isolation + illusion of abundance), file systems (durability across crashes: journaling), concurrency (races, locks, deadlock and its four conditions). Ground in what the student sees: `top`, a frozen laptop under memory pressure, a race condition that only appears under load.

**Computer networks.** Layering as a separation of concerns, but teach from a real request (what happens when you load a web page: DNS, TCP handshake, TLS, HTTP). Physical constraints drive design: propagation delay (speed of light in fibre ≈ 2×10⁸ m/s), bandwidth-delay product, loss. For protocols, draw time-sequence diagrams (two vertical lines, diagonal arrows for packets).

**Distributed systems.** The two enemies are partial failure and lack of a global clock. Teach from a concrete failure: a network partition between datacenters, a node that's slow rather than dead. Consensus (Paxos/Raft) as "how do machines agree when any of them may crash"; CAP as a forced choice *during a partition*; consistency models as contracts about what reads may return.

**Databases.** Indexes (B-trees because of page-sized I/O), query planning (cost estimation from statistics), transactions and isolation anomalies (lost update, write skew; double-booking the last seat), logging and recovery (write-ahead logs). Use real query shapes and realistic table sizes.

**Programming languages and compilers.** Pipeline: lexing → parsing (grammar, AST) → semantic analysis (types, scopes) → IR → optimisation → code generation. Show a real line of code passing through each phase. Type systems as machine-checked proofs of the absence of certain errors. Garbage collection strategies with their pause/throughput trade-offs.

**Software engineering.** Teach practices as solutions to pains the student has felt: version control (lost work, conflicting edits), tests (fear of changing code), abstraction and modularity (change rippling through a codebase). Avoid dogma; give the trade-off.

**Artificial intelligence, machine learning, deep learning.** For every model: what's the input and output, what's the hypothesis class, what's the loss and why that loss, how is it optimised, what inductive bias does the architecture encode, and how does it fail (overfitting, distribution shift, spurious correlations). Track tensor shapes throughout. Separate what is mathematically guaranteed from what is empirically observed (e.g., why over-parameterised networks generalise is still an active research question; say so).

**Statistics.** Always state the data-generating assumptions (independence, identical distribution, model form). Distinguish estimation, testing and prediction. Use real-feeling study designs (A/B tests, clinical trials, surveys), and teach what conclusions the design does and does not license (correlation vs. causation; randomisation is what buys causal claims).

**Physics.** Start from the phenomenon, then the conservation law or principle that constrains it, then the equation. Units in every line; limiting cases as checks; order-of-magnitude estimates before precise calculation. Be accurate about popular myths (lift is not explained by the "equal transit time" story; Tacoma Narrows was flutter).

**Engineering.** Every design is a trade-off under constraints (cost, safety factor, tolerance, power, latency). Show the trade-off curve, not just the chosen point. Feedback, stability and margins recur everywhere.

**Scientific computing.** Discretisation error vs. rounding error; stability and conditioning; vectorisation and memory layout; verifying a solver against an analytic solution before trusting it.

**Research methodology.** Hypotheses that can fail; controls and baselines; ablations; statistical power; the difference between exploratory and confirmatory analysis; reproducibility (seeds, variance across runs, reporting error bars).

## Code snippets inside conceptual lessons

Short code is welcome when it *shows* the idea (ten lines of NumPy that run gradient descent and print the loss). Explain what each line corresponds to in the concept. For full implementation teaching, see `implementation.md`.
