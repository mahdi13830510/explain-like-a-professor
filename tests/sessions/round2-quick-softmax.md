To stop exp from overflowing, and it costs nothing because softmax doesn't change when you shift every logit by the same constant c:

```
exp(zᵢ − c) / Σⱼ exp(zⱼ − c)  =  e⁻ᶜ·exp(zᵢ) / (e⁻ᶜ·Σⱼ exp(zⱼ))  =  exp(zᵢ) / Σⱼ exp(zⱼ)
```

The e⁻ᶜ factor cancels between numerator and denominator. In float32, exp(x) overflows to inf once x passes about 88.7 (in float16 the limit is about 11), and logits that large are normal in practice. Take z = [1000, 999]: the naive version computes inf/inf = NaN. Subtract the max and you get [0, −1], which gives e⁰/(e⁰ + e⁻¹) = 1/1.368 ≈ [0.731, 0.269], the exact answer. Choosing c = max specifically buys you two guarantees. The largest exponent is exactly exp(0) = 1, so nothing can overflow. And the denominator is at least 1, so even when every other term underflows to 0 you never divide by zero or take log(0). The same shift is how log-sum-exp is computed stably, which is why cross-entropy losses take raw logits rather than probabilities.

Want me to show why fusing log and softmax into one step also fixes the underflow side, which the max-subtraction alone doesn't fully handle?
