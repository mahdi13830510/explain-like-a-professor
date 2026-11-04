Suppose you start copying a 2 GB dataset from your laptop to a server on the other side of the country. Your laptop's network card can push a gigabit per second. Somewhere between you and the server there's a slower link, say a 100 Mbit/s segment, and it's shared with your housemate's video call and with traffic from people you will never meet. Nobody tells your laptop how fast that link is. No router sends "slow down to 37 Mbit/s". So how fast should your laptop send?

Too slow and you waste the path: the transfer takes ten times longer than it needs to. Too fast and the bytes don't vanish. They pile up in the router in front of the slow link, in a memory buffer of finite size, and once it's full the router has no choice but to drop packets. TCP congestion control is the answer to that one question. Each sender works out a sending rate using only what it can observe from its own end, and the rule it uses has to keep thousands of strangers sharing one bottleneck without wrecking it for each other.

### Why "just send as fast as the receiver allows" isn't enough

TCP already had one brake before congestion control existed: *flow control*. The receiver advertises a window, "I have buffer space for 64 KB more", and the sender never has more than that much unacknowledged data in flight. That protects the *receiver*. It says nothing about the network in between. A fast server talking to a fast client will happily fill the whole advertised window, even when a slow link in the middle can't carry it.

In the mid-1980s that's all TCP had, and the results were dramatic. In October 1986 the throughput between Lawrence Berkeley Laboratory and UC Berkeley, sites about 400 yards apart, fell from 32 kbit/s to 40 bit/s, a factor of roughly a thousand. Van Jacobson described this in the 1988 paper *Congestion Avoidance and Control* (with Mike Karels), and it's worth seeing why things got so bad. When a queue overflows, packets are dropped. The senders' retransmission timers expire and they resend. But the network is still overloaded, so the retransmissions also queue up and get dropped, and the timers, tuned for an unloaded network, sometimes fire on packets that were only delayed, not lost. The links stay completely busy carrying copies of packets that won't be useful. This is *congestion collapse*: the offered load goes up and the useful throughput goes *down*. More effort makes things worse, which is exactly the opposite of what an uncoordinated sender would expect.

So the problem has a specific shape. Each sender needs a rate that (a) uses the available capacity, (b) backs off when the path is overloaded, and (c) ends up sharing fairly with others, all without any explicit information from the network.

### The signal hiding in plain sight

What *can* a sender observe? Only two things come back to it: acknowledgements (ACKs) and the lack of them. Jacobson's key observation was that on wired networks a packet is almost never lost because of bit corruption. It's lost because a queue overflowed. **So a loss is a message from the network, and it means "you, collectively, are sending too much."** This one-bit signal is all classic TCP has to work with.

The second observation is about *what* to control. Rather than setting a rate in bits per second, TCP limits how much data may be in flight, meaning sent but not yet acknowledged. Picture the path as a pipe. Data takes one round-trip time (RTT) to go out and have its ACK come back, so if you keep W bytes in flight, you send roughly W bytes per RTT:

```
rate ≈ W / RTT          W in bytes, RTT in seconds → bytes per second
```

Limiting data in flight has a lovely side effect. When packets cross the slow link they get spaced out to that link's rate, and the ACKs come back with the same spacing. A new packet is released only when an ACK arrives, so the sender automatically transmits at the bottleneck's pace without ever measuring it. Jacobson called this *self-clocking*. The ACKs act like a metronome set by the slowest link.

How big should W be? Just enough to keep the pipe full. The pipe's capacity is the bottleneck bandwidth times the round-trip time, called the **bandwidth-delay product (BDP)**. For our cross-country transfer, take a 100 Mbit/s bottleneck and a 50 ms RTT:

```
BDP = 100×10⁶ bit/s × 0.050 s          bandwidth × round-trip time
    = 5×10⁶ bit
    = 625,000 bytes                      ÷ 8 bits per byte
    ≈ 428 segments                       ÷ 1,460 bytes per segment (typical MSS)
```

With fewer than 428 segments in flight the link sits idle part of the time. With more, the extra segments queue in the router's buffer. Beyond that buffer's size, they get dropped.

The sender doesn't know that 428 exists. It has to find the number, and track it as other flows come and go. Now we can name the variable TCP uses to do that. The **congestion window**, cwnd, is the sender's current guess at how much it may have in flight. The actual limit is min(cwnd, receiver's window): congestion control and flow control are two separate brakes, and whichever is tighter wins. From here on I'll measure cwnd in segments of one MSS (maximum segment size, about 1,460 bytes on Ethernet paths), which is how people usually reason about it.

### How to move cwnd: additive increase, multiplicative decrease

We have a knob (cwnd) and a binary signal (loss or no loss). What's the natural first attempt at a rule? Something symmetric, like "add one segment per RTT when things are fine, subtract one when you see a loss." That turns out to be wrong in an interesting way. The way to see why is a picture due to Chiu and Jain (1989), and it's the real core of the subject.

Take two flows sharing one bottleneck. Put flow 1's rate x₁ on the horizontal axis and flow 2's rate x₂ on the vertical. Two lines matter. The **efficiency line** x₁ + x₂ = C (C is the capacity) runs diagonally from top-left to bottom-right: below it the link is under-used, above it there's overload and loss. The **fairness line** x₁ = x₂ runs at 45° through the origin. The goal is the point where they cross, (C/2, C/2).

```
 x₂
  │\            fairness line x₁ = x₂
  │ \          /
  │  \       /
  │   \    /        above the diagonal "\": overload, losses
  │    \ /
  │    /●   ← goal: (C/2, C/2)
  │  /    \
  │/        \     efficiency line x₁ + x₂ = C
  └───────────\──── x₁
```

Both flows see the same signal at the same time (the shared queue overflows or it doesn't), and both apply the same rule. Now look at what each kind of move does geometrically.

*Additive increase*, both adding the same amount a, moves the point by (a, a). That's parallel to the fairness line, so it changes the total but **leaves the difference x₁ − x₂ unchanged**.

*Multiplicative decrease*, both multiplying by the same factor b < 1, moves the point toward the origin along the straight line through it. It keeps the **ratio** x₁/x₂ unchanged, but it **scales the difference by b**.

Combine them, adding on good news and multiplying on bad news, and track the difference d = x₁ − x₂ across one full cycle:

```
during increases:  d → d                  each flow adds the same a, so a cancels in x₁ − x₂
at a loss:         d → b·d                (b x₁) − (b x₂) = b(x₁ − x₂)
after k cycles:    d_k = bᵏ · d₀          one multiplication per cycle
                   → 0 as k → ∞           since 0 < b < 1
```

So AIMD converges to fairness. Meanwhile the total keeps bumping into the efficiency line from below and backing off, so it hovers around full use. Now check the alternatives the same way. With additive increase and additive decrease, both moves preserve d, so an unfair start stays unfair forever. With multiplicative increase and multiplicative decrease, both moves preserve the ratio x₁/x₂, so a 4:1 split stays 4:1 forever. AIMD is the combination that shrinks unfairness *and* doesn't settle somewhere wasteful.

I ran exactly this, with a capacity of 500 segments per RTT, flow 1 starting at 400, flow 2 at 50, both adding 1 per RTT and halving on loss (b = ½). Here are the values at each loss event:

```
 RTT    flow 1    flow 2    difference
  26    426.0      76.0       350.0
 152    338.0     163.0       175.0
 278    294.0     206.5        87.5
 404    272.0     228.3        43.8
 530    261.0     239.1        21.9
 656    255.5     244.6        10.9
```

The difference halves at every loss, just as the derivation said. Running the same start with additive decrease leaves the difference at exactly 350 for as long as you like. With multiplicative increase and decrease the ratio stays at exactly 8.

Before you take the "fairness" too literally, look at the assumptions. Both flows got the loss signal at the same moment, and both added "1 per RTT" with the *same* RTT. Keep those in mind; they come back below.

Here is TCP's version of the rule (Reno, as standardised in RFC 5681). On each ACK in this phase, which is called **congestion avoidance**,

```
cwnd ← cwnd + 1/cwnd        (in segments)
```

so that over one RTT, which brings about cwnd ACKs, the window grows by about cwnd · (1/cwnd) = 1 segment. On a loss detected by three duplicate ACKs, cwnd is halved. So b = ½ and a = 1 segment per RTT.

### Slow start: finding the right range quickly

AIMD has a problem at the beginning of a connection. Climbing one segment per RTT from 10 to our 428 would take about 418 RTTs, roughly 21 seconds at 50 ms, and most downloads finish long before that. So a new connection uses a different rule until it gets a first sense of where the ceiling is. In **slow start**, each ACK adds one full segment to cwnd. Each segment in flight comes back as an ACK that adds one more, so the window **doubles every RTT**. (It's "slow" only compared to what TCP did before 1988, which was to send the entire receiver window at once.)

The handover point is a variable called **ssthresh** (slow-start threshold). While cwnd < ssthresh, use slow start; above it, use congestion avoidance. A new connection starts with ssthresh effectively infinite, so it doubles until the first loss. That loss sets ssthresh to half the window at the time of the loss. Modern stacks start at an initial window of 10 segments (RFC 6928).

Let's trace our cross-country transfer. The path holds 428 segments in flight at full speed, and say the bottleneck router can queue another 214 (half a BDP), so losses start once more than 428 + 214 = 642 segments are in flight. This is a per-RTT simulation, which is coarse but captures the dynamics:

```
RTT   cwnd   link utilisation   what happens
  0     10        2%            slow start: double each RTT
  1     20        5%
  2     40        9%
  3     80       19%
  4    160       37%
  5    320       75%
  6    640      100%            queue nearly full; next doubling overflows → loss
  7    321       75%            ssthresh = 642/2 = 321, cwnd = 321, congestion avoidance
  8    322       75%            +1 per RTT ...
 ...
 113   428      100%            pipe exactly full, queue empty
 ...
 328   642      100%            queue full (214 segments queued) → loss, halve to 321
```

Read the numbers carefully. Slow start found the right range in about 6 RTTs, 0.3 seconds. After that the window traces a **sawtooth**: up from 321 to 642 one segment at a time, then down to 321, with a period of 322 RTTs, about 16 seconds. In the part of each tooth where cwnd < 428 the link is partly idle. Averaged over a cycle, utilisation is about 96%.

The other side of the sawtooth matters as much. At the top of each tooth, 214 segments are sitting in the router's queue. At 100 Mbit/s that queue takes 214 × 1,460 × 8 / 10⁸ ≈ 25 ms to drain, so the RTT the user actually experiences swings between 50 ms and 75 ms, every 16 seconds, because of TCP's own probing. Remember that queue; it becomes a whole problem of its own.

The sawtooth also tells you how big the buffer should be. After a loss, cwnd drops to (C + B)/2, where C is the BDP and B the buffer, both in segments. The link stays fully busy right after the loss only if that's still at least C:

```
(C + B)/2 ≥ C   ⇔   B ≥ C          multiply by 2, subtract C
```

That's where the old rule of thumb "router buffer = bandwidth × RTT" comes from. With B = C, a single Reno flow keeps the link at 100%. Our B = C/2 cost us about 4%.

### Detecting loss: three duplicate ACKs versus a timeout

I've been saying "on a loss" as if the sender just knows. It infers it in one of two ways. TCP's ACKs are cumulative: "I have everything up to byte n." If segment 5 is dropped but 6, 7 and 8 arrive, the receiver answers each with "still waiting for 5". The sender sees duplicate ACKs.

```
sender                      receiver
  │──seg 5──X (dropped)        │
  │──seg 6───────────────────▶│
  │◀──────────── ACK "need 5"──│   dup 1
  │──seg 7───────────────────▶│
  │◀──────────── ACK "need 5"──│   dup 2
  │──seg 8───────────────────▶│
  │◀──────────── ACK "need 5"──│   dup 3 → fast retransmit seg 5
```

Three duplicates mean segments are still getting through. The path is congested but working, and that's the case where Reno halves cwnd and keeps going (*fast retransmit* and *fast recovery*). The threshold is three rather than one because a reordered packet can also cause a duplicate ACK or two.

If instead *nothing* comes back and the retransmission timer expires, the situation looks much worse. Reno then resets cwnd to 1 segment and slow-starts again up to ssthresh. The earlier Tahoe version did this on every loss, which is why its sawtooth dropped to the floor each time.

### How throughput depends on loss: deriving the square-root law

The sawtooth gives us a quantitative law. Suppose a flow in steady congestion avoidance sees a loss each time its window reaches W segments. Assume one loss per cycle, a constant RTT, and that we can ignore timeouts and slow start. (These are the assumptions of the well-known model by Mathis et al., 1997.)

```
window per cycle:     W/2 → W, +1 per RTT       halve on loss, additive increase
cycle length:         W/2 RTTs                  need W/2 increments of 1
average window:       (W/2 + W)/2 = 3W/4        linear ramp, so the average is the midpoint
packets per cycle:    (3W/4)·(W/2) = 3W²/8      average window × number of RTTs
loss probability:     p = 1 / (3W²/8)           one loss per cycle's worth of packets
                        = 8 / (3W²)
solve for W:          W = √(8 / (3p))
throughput:           T = (3W/4) · MSS / RTT    average window per RTT
                        = (3/4)·√(8/(3p)) · MSS/RTT
                        = √(9·8 / (16·3p)) · MSS/RTT      bring 3/4 inside the root as 9/16
                        = √(3/(2p)) · MSS/RTT
                        ≈ 1.22 · MSS / (RTT·√p)
```

Two things in that formula deserve attention. First, throughput falls only as 1/√p: to double your speed, the loss rate must drop fourfold. Second, throughput is proportional to **1/RTT**. Two flows sharing a bottleneck, one with a 10 ms RTT and one with 100 ms, see the same loss rate but grow their windows on different clocks, and the short-RTT flow gets about ten times the bandwidth. That's the hidden cost of the "same RTT" assumption from the phase-plane picture: AIMD is fair in *windows*, not in *rates*.

Sanity-check the units: MSS/RTT is bytes per second, and p is dimensionless, so T is a rate. For a quick number, take MSS = 1,460 bytes, RTT = 50 ms and p = 10⁻³ (one packet in a thousand lost). The formula gives about 9 Mbit/s. At p = 10⁻⁴ it gives about 29 Mbit/s, √10 ≈ 3.16 times more, as the square root says it should.

Now push the formula somewhere uncomfortable. You want a single standard TCP flow to fill a 10 Gbit/s link with a 100 ms RTT (a transatlantic research link, say), using 1,500-byte packets. That needs an average window of 10¹⁰ × 0.1 / (1,500 × 8) ≈ 83,333 packets. Inverting the formula, √(3/(2p)) = 83,333 gives p ≈ 2.2 × 10⁻¹⁰: **at most one loss in about 4.6 billion packets**, roughly one loss every 90 minutes. The recovery is just as bad. After a loss the window falls from about 111,000 to 55,500 and climbs back at one packet per 100 ms, which takes about 90 minutes too. No real long-haul path is that clean, so Reno simply cannot fill such a link. (RFC 3649, which proposed HighSpeed TCP, made this same argument with nearly the same numbers.) The additive increase that gave us fairness is far too timid when the BDP is enormous.

### What actually runs today

That calculation is the main reason Reno is no longer the default. **CUBIC** has been the default in Linux since 2006 (now RFC 9438), and so it governs most server traffic on the Internet. It keeps the AIMD skeleton but changes the shape of the increase. After a loss at window W_max it cuts cwnd to 0.7·W_max, then sets the window as a cubic function of the *time* since that loss:

```
W(t) = C·(t − K)³ + W_max          C = 0.4, t in seconds
K    = ∛(W_max·(1 − 0.7) / C)       the time at which W returns to W_max
```

The cubic rises fast at first, flattens out as it nears the old ceiling W_max (where the last loss happened, so tread carefully), and then accelerates again to probe for new capacity if nothing breaks. Because growth is tied to wall-clock time rather than to ACK arrivals, a long-RTT flow is far less disadvantaged than under Reno. For the 10 Gbit/s example, K comes to about 40 seconds instead of 90 minutes.

**BBR**, published by Google in 2016, abandons loss as the main signal. It continuously estimates two numbers, the bottleneck bandwidth (the highest delivery rate it has recently seen) and the minimum RTT (the path delay with empty queues), and paces packets at that bandwidth with about one BDP in flight. Look back at our trace to see the motivation. Loss-based TCP has to fill the buffer to find the limit, so it *creates* the 25 ms of queuing delay it later suffers. With the very large buffers in many home routers and cable modems, that standing queue can reach hundreds of milliseconds, a problem called *bufferbloat*. BBR aims to sit at the point where the pipe is full but the queue is empty. Its own fairness with loss-based flows has been a subject of real study and revision (BBRv2/v3), so treat it as an active design area rather than a solved one.

Two other variations are worth knowing. **ECN** (Explicit Congestion Notification, RFC 3168) lets a router *mark* a packet instead of dropping it, giving the same signal without the loss. **DCTCP**, used in data centres, reacts to the *fraction* of marked packets rather than cutting by half on any mark, which keeps queues very short on fast, low-RTT networks. And because QUIC (the transport under HTTP/3) runs in user space, its congestion control (usually CUBIC or BBR) can be changed without touching the operating-system kernel.

### Where the core idea is fragile

The founding assumption was "loss means congestion." On Wi-Fi and cellular links, packets can be lost to radio interference, and a loss-based sender halves its window in response to noise. Link-layer retransmission mostly hides this today, but it's why wireless was a long-standing pain point. Delay-based signals have their own problem: a flow that backs off when queues grow loses out to a loss-based flow that keeps pushing until the buffer overflows. That's why delay-based TCP Vegas (1994) never displaced Reno, despite good behaviour when it ran alone.

There's also a deeper point. Congestion control is a *voluntary* protocol. Nothing in the network forces your sender to halve its window, and the Internet works because almost all endpoints run cooperating algorithms. That's why a new algorithm gets judged by whether it's fair to the existing ones, not just by how fast it runs on its own.

You may hear congestion control compared to the metering lights on highway on-ramps, which hold cars back to keep the main road flowing. The analogy captures *admission* control: limiting entry protects throughput for everyone. It breaks in two ways. The meter is set centrally from road sensors, while TCP's control is decentralised and inferred from the endpoints. And an overfull road slows cars down but never deletes them, whereas the dropped packet is precisely what TCP listens for.

### Try these

1. Predict before computing: our flow is in congestion avoidance with cwnd = 400 segments and an RTT of 50 ms. The path is rerouted and the RTT becomes 100 ms, with the same bottleneck capacity. What happens to the throughput immediately, how many segments does the window now need to fill the pipe, and how long will Reno take to get there?

2. AIMD shrinks the gap between two flows by half per loss event because both apply the same b. Suppose a "greedy" flow uses b = 0.9 (cut by only 10%) against a standard flow with b = 0.5, both adding 1 segment per RTT, with synchronised losses. Write the update for the two windows over one cycle and find the fixed point of the ratio x_greedy / x_standard. (Hint: at equilibrium, each flow's total increase over a cycle must equal its decrease.)

If you'd like to go further, there are two good threads to pull: the fluid-model view of TCP as a feedback control loop (where the stability of the queue depends on RTT and buffer size), or BBR's state machine in detail. I can also write a short packet-level simulator so you can watch the sawtooth and bufferbloat happen.
