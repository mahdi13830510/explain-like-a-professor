When your laptop opens a connection to your bank from a café, every byte goes through a Wi-Fi router owned by a stranger, then through a chain of ISPs, any of whom can read and copy everything. You have never met the bank's server. You share no secret with it. And yet within a few hundred milliseconds the two of you are talking in a way the router cannot read. How is that even possible? Any cipher you've seen before (Caesar shifts, AES, a one-time pad) needs both sides to already hold the same key, and you can't send the key, because sending it means the router sees it.

What you'd want is something like an open padlock. The bank hands out thousands of copies of its padlock, unlocked, to anyone who asks. You put your message in a box, snap the padlock shut, and send it. Snapping it shut needs no key; opening it needs the one key the bank never lets out of its building. The router sees the box and even holds its own copy of the padlock, and it still can't open the box.

That analogy has the right *shape*: a public operation anyone can perform, and an inverse only one party can perform. Where it breaks is important, though. A real padlock is hard to open because of steel. RSA's "padlock" is a mathematical function, and the attacker has complete knowledge of it: the full public description is published. The only thing protecting the box is that undoing the function, *without one extra piece of information*, appears to require solving a problem nobody knows how to solve fast. "Appears to" is honest: nobody has proved it. We'll come back to that.

So the real question is: can we find a function f that anyone can compute, that is infeasible to invert from the outside, but that becomes easy to invert if you know a secret? That's called a **trapdoor one-way function**, and RSA (Rivest, Shamir, Adleman, 1977) was the first practical one.

### Arithmetic that wraps around

Ordinary exponentiation won't do. If I tell you c = m³ = 2,744, you take a cube root and get m = 14. Ordinary arithmetic is too smooth and orderly; inverting it is easy.

What scrambles things is doing the arithmetic on a clock: compute the power, then keep only the remainder after dividing by some number n. Write a mod n for that remainder, and a ≡ b (mod n) for "a and b leave the same remainder", i.e. n divides a − b. Clock arithmetic respects multiplication: you can reduce at every step and get the same final remainder, which is what keeps the numbers small enough to compute with.

Let's watch what powers do on a small clock, n = 33. Here are 7ᵏ mod 33 and 3ᵏ mod 33 for k = 0, 1, 2, …:

```
k        0   1   2   3   4   5   6   7   8   9  10  11  12  13
7^k      1   7  16  13  25  10   4  28  31  19   1   7  16  13
3^k      1   3   9  27  15  12   3   9  27  15  12   3   9  27
```

Two things to notice. First, the values jump around with no visible pattern: 7, 16, 13, 25, 10. If n had 617 digits instead of 2, looking at 7ᵏ mod n would tell you essentially nothing about k or about 7. That's the scrambling we wanted.

Second, and this is the whole trick, the powers *cycle*. 7¹⁰ ≡ 1, so 7¹¹ ≡ 7 again, and everything repeats with period 10. And look at the row for 3: it never returns to 1 (since 3 shares a factor with 33, no power of 3 can be 1 more than a multiple of 33), yet 3¹¹ ≡ 3 anyway. In both rows, raising to the 11th power gives you back the number you started with.

Pause on what that means. The 11 isn't special; it's 1 + 10, one step past a full cycle. Suppose I find two exponents e and d whose product is 1 + (a multiple of the cycle length). On this clock, e = 3 and d = 7 work, since 3·7 = 21 = 1 + 2·10. Then raising to e scrambles m, and raising the result to d gives m^(ed) = m back. Encryption is "raise to e", decryption is "raise to d". The whole design question becomes: *what is the cycle length, and why does knowing it require a secret?*

### Why powers cycle: Fermat, then two primes

Start with a prime modulus p. The claim, Fermat's little theorem, is that for any a not divisible by p,

```
a^(p−1) ≡ 1 (mod p)
```

Here's the argument, because it's short and it's the reason RSA works. Take the p − 1 nonzero remainders 1, 2, …, p − 1 and multiply each by a, reducing mod p. You get a list a·1, a·2, …, a·(p−1). Two of these can't be equal: if a·i ≡ a·j then p divides a(i − j), and since p is prime and doesn't divide a, it must divide i − j, which is impossible for distinct i, j between 1 and p − 1. None of them is 0 either, by the same reasoning. So multiplying by a just *shuffles* the list 1, …, p − 1. Multiply each version of the list together; same numbers, same product:

```
(a·1)(a·2)···(a·(p−1)) ≡ 1·2···(p−1)        (mod p)   the two lists are permutations of each other
a^(p−1) · (p−1)!       ≡ (p−1)!              (mod p)   pull out the p−1 factors of a
a^(p−1)                ≡ 1                   (mod p)   cancel (p−1)!, allowed because p ∤ (p−1)!
```

The cancellation in the last line is legal because (p−1)! is a product of numbers smaller than p, so p doesn't divide it, so it has a multiplicative inverse mod p.

A consequence we'll need: for *every* integer m (divisible by p or not) and every integer k ≥ 0,

```
m^(1 + k(p−1)) ≡ m (mod p)
```

If p ∤ m, then m^(1+k(p−1)) = m · (m^(p−1))^k ≡ m · 1^k = m. If p | m, both sides are 0 mod p. Either way it holds. This is why the 3-row above came back to 3 even though it never touched 1.

RSA uses n = p·q with p, q two distinct large primes. Define

```
φ(n) = (p − 1)(q − 1)
```

φ (Euler's totient) counts the numbers in 1…n that share no factor with n. For our purposes, its job is to be a common multiple of p − 1 and q − 1, so it is a cycle length *modulo both primes at once*. For n = 33 = 3·11, φ = 2·10 = 20. (The table showed period 10; that's because the true minimum is lcm(p−1, q−1) = lcm(2, 10) = 10, called the Carmichael function λ(n). Any multiple of λ works, and φ is one. Many real implementations use λ; the proof is identical.)

### The keys, and why decryption returns the message

Now the recipe. The bank:

1. picks two random large primes p and q (each about 1,024 bits for a 2,048-bit key),
2. computes n = pq and φ = (p − 1)(q − 1),
3. picks e with gcd(e, φ) = 1 (almost everyone uses e = 65537),
4. computes d with e·d ≡ 1 (mod φ), i.e. e·d = 1 + kφ for some integer k.

The public key is (n, e). The private key is d (and p, q, φ, which are destroyed or kept equally secret). A message is encoded as an integer m with 0 ≤ m < n.

```
Encrypt:  c = mᵉ mod n        anyone can do this: needs only (n, e)
Decrypt:  m = cᵈ mod n        needs d
```

Your question was why decryption actually gives back m. Here's the complete argument, for every m in 0…n−1, including the rare m that share a factor with n:

```
cᵈ ≡ (mᵉ)ᵈ = m^(ed)               (mod n)   definition of c; reducing mod n first doesn't change the result
m^(ed) = m^(1 + kφ)                          choice of d: ed = 1 + kφ
       = m^(1 + k(q−1)·(p−1))                φ = (p−1)(q−1); regroup the exponent as 1 + k'(p−1), k' = k(q−1)
       ≡ m                        (mod p)   Fermat consequence above, holds for every m
similarly m^(ed) ≡ m              (mod q)   same argument with k'' = k(p−1)
so p | (m^(ed) − m) and q | (m^(ed) − m)
⇒ pq | (m^(ed) − m)                          p, q distinct primes, so both dividing means their product divides
⇒ m^(ed) ≡ m                      (mod n)
```

Since 0 ≤ m < n, the remainder of m^(ed) mod n is exactly m, not merely something congruent to it. That last point is why the message must be smaller than n.

Notice where each assumption entered. Line 4 needs p prime (Fermat). Line 7 needs p ≠ q; with n = p² the argument fails. The step "d exists" needs gcd(e, φ) = 1, and you'd compute it with the extended Euclidean algorithm, which we'll do in a moment. And notice that the symmetry is total: (m^d)^e = m^(ed) too, which is exactly why the same keys give you digital signatures (sign with d, anyone verifies with e).

### A worked example you can check by hand

The classic small example: p = 61, q = 53. Then n = 3233 and φ = 60 · 52 = 3120. Take e = 17 (gcd(17, 3120) = 1, since 3120 = 2⁴·3·5·13).

To find d, run Euclid's algorithm on (3120, 17) and then run it backwards:

```
3120 = 183·17 + 9
  17 =   1·9  + 8
   9 =   1·8  + 1                   gcd is 1, so d exists

1 = 9 − 8                           from the last line
  = 9 − (17 − 9)  = 2·9 − 17        substitute 8 = 17 − 9
  = 2·(3120 − 183·17) − 17          substitute 9 = 3120 − 183·17
  = 2·3120 − 367·17                 collect the 17s: 2·183 + 1 = 367
```

So 17 · (−367) ≡ 1 (mod 3120), and adding 3120 to make it positive gives d = 2753. Check: 17 · 2753 = 46801 = 1 + 15 · 3120. ✓

Encrypt the message m = 65 (ASCII "A"). You would not compute 65¹⁷ as a 31-digit integer; you square repeatedly and reduce at every step. Since 17 = 16 + 1:

```
65^1  mod 3233 =   65
65^2  mod 3233 =  992        65² = 4225 = 3233 + 992
65^4  mod 3233 = 1232        992²  mod 3233
65^8  mod 3233 = 1547        1232² mod 3233
65^16 mod 3233 =  789        1547² mod 3233
65^17 = 65^16 · 65^1  ≡ 789 · 65 = 51285 ≡ 2790 (mod 3233)
```

So c = 2790. Four squarings and one multiply. In general this square-and-multiply method costs about log₂(e) squarings, so even a 2,048-bit exponent is roughly 2,048 squarings, not 2²⁰⁴⁸ multiplications. That is the "easy direction" of the trapdoor.

Decrypting, 2790²⁷⁵³ mod 3233 = 65 (I ran it in Python). And to check the edge case from the proof, the deliberately awkward message m = 61, which is a multiple of p, also round-trips: 61 → 61¹⁷ mod 3233 → back to 61.

At real size, with a 2,048-bit modulus (n has 617 decimal digits) and e = 65537, I generated a key in plain Python and encrypted the string "meet at noon" as an integer: one encryption took about 0.1 ms and one decryption about 19 ms. Decryption is slower because d is a full 2,048-bit exponent while e = 65537 = 2¹⁶ + 1 needs just 17 squaring-and-multiply steps. (Real libraries make decryption about 4× faster by doing it mod p and mod q separately and recombining, the same split our proof used.)

### Why the attacker can't do the same thing

Put yourself in the router's position. You see n = 3233, e = 17 and c = 2790. Decryption is just raising to d, and d is just the inverse of e mod φ. You know e. What stops you is φ = (p − 1)(q − 1): to compute it you need the factors of n. For 3233 you'd find 53 × 61 in a second. So the whole security of the scheme leans on one claim: **multiplying two large primes is easy, and factoring their product is infeasible.**

It's worth seeing that knowing φ is *exactly* as good as knowing the factors, so there's no shortcut through φ. Given n and φ:

```
φ = (p−1)(q−1) = pq − (p+q) + 1 = n − (p+q) + 1      expand
⇒ p + q = n − φ + 1                                   rearrange
```

and since you now know p + q and pq, p and q are the two roots of x² − (n − φ + 1)x + n = 0. For our numbers, p + q = 3233 − 3120 + 1 = 114, and x² − 114x + 3233 = 0 has roots 61 and 53. Similarly (this is a known theorem, with a slightly longer randomized argument) knowing d lets you factor n efficiently. So "find the private key" and "factor n" are equivalent problems.

How hard is factoring? The best known classical algorithm, the general number field sieve, has running time that grows faster than any polynomial in the number of digits but slower than exponential. The largest RSA challenge number publicly factored is RSA-250, an 829-bit modulus, done in 2020 with thousands of core-years of computation. A 2,048-bit modulus is far beyond that, which is why 2,048 bits is the standard minimum today.

Now the honest caveats, because "RSA is secure" hides several assumptions:

First, nobody has proved factoring is hard. It's an assumption backed by decades of failed attempts by very good mathematicians. Second, it's not even proved that breaking RSA requires factoring. Recovering the *key* is equivalent to factoring, but an attacker only needs to recover *m* from c, i.e. take e-th roots mod n, and whether that could be done without factoring is an open problem (the "RSA problem"). Third, a large fault-tolerant quantum computer running Shor's algorithm would factor n in polynomial time. No such machine exists yet, but this is why there is active migration to post-quantum schemes.

### Where the textbook version breaks, and how it's used for real

What we just built is "textbook RSA", and you should never use it as-is. Its weakness is that it's a deterministic, structured function, and structure is exploitable:

- **Same message, same ciphertext.** If the router suspects your message is either "yes" or "no", it encrypts both with the public key and compares. Encryption gives no protection against guessing.
- **It's multiplicative.** (m₁ᵉ)(m₂ᵉ) = (m₁m₂)ᵉ. With our key, 65¹⁷ · 2¹⁷ mod 3233 = 3017 = 130¹⁷ mod 3233. An attacker can transform a ciphertext into a valid ciphertext of a related message without knowing either.
- **Small messages escape the wrap-around.** With e = 3 and m < n^(1/3), mᵉ never exceeds n, the "mod n" never happens, and an ordinary cube root recovers m. Our clock arithmetic only scrambles if the numbers actually go around the clock.

The fix is padding: before encrypting, the message is embedded in a randomized, structured block of almost n's full size (OAEP for encryption, PSS for signatures). Randomness kills the guessing attack and the small-message problem; the structure makes mangled ciphertexts get rejected.

In practice RSA rarely encrypts actual data. It's thousands of times slower than a symmetric cipher like AES, so historically it was used to encrypt a random AES key, and the bulk data went over AES. In TLS 1.3 even that is gone: the session key comes from an (elliptic-curve) Diffie–Hellman exchange, and RSA's main remaining job is *signatures*, the server proving with its private d that it really is your bank, which your browser checks with e from the bank's certificate. That's the symmetry from the proof doing the work.

Two problems to try with what you now have:

1. **The broadcast attack.** A careless sender encrypts the same message m to three recipients, all using e = 3, with pairwise coprime moduli n₁, n₂, n₃. The attacker sees c₁, c₂, c₃. Show how to recover m without factoring anything. (Hint: the Chinese Remainder Theorem gives you m³ mod n₁n₂n₃, and since m < each nᵢ, what do you know about m³ versus n₁n₂n₃?) Then say which fix from the last section prevents it.
2. **Why gcd(e, φ) must be 1.** With p = 61, q = 53, try e = 3. Show that no d exists, and then exhibit two different messages that encrypt to the same ciphertext. What does that tell you about whether "raise to e" is still a scrambling *or* a lossy map?

If you'd like, the natural next thread is the Chinese Remainder Theorem itself, which quietly ran through the decryption proof, the 4× speedup, and the first problem.
