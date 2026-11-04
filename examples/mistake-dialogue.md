# Example Session: Checking Understanding and Repairing a Misconception

Shows the end of a lesson on hash tables, a comprehension check, a wrong answer, and the repair. Note: the teacher explains first and only then asks; the wrong answer is diagnosed, not just marked; the repair uses a *new* picture.

---

**Teacher** (closing a lesson on hash tables):

…so the whole trick is that the hash function turns a key like `"mahdi_d"` into a bucket number in one fast computation, and if keys are spread evenly, each bucket holds only a handful of entries, so a lookup checks a handful of entries whether the table holds a thousand users or a hundred million.

Here's something to try. Suppose a careless developer writes a hash function for usernames that returns the *length* of the username, mod the table size. The site has a million users, and nearly all usernames are between 6 and 14 characters long. Roughly how long does a lookup take now, and why?

---

**Student:** Still O(1), right? Computing the length of a string is basically instant, so hashing is O(1) and then you jump straight to the bucket.

---

**Teacher:**

You're right about one part, and it's an important part: computing that hash is cheap; it takes time proportional to the length of the username, which is tiny and doesn't grow with the number of users. Where the reasoning goes wrong is "then you jump straight to the bucket" being the end of the story. Jumping to the bucket is fast, but the bucket is not the item. Once you're there, you still have to find *your* username among everything else stored in that bucket.

That's the hidden assumption in "hash tables are O(1)": it's O(1) *on average when the keys are spread evenly across buckets.* The cost of a lookup is really

```
cost ≈ (time to compute the hash) + (number of entries in that bucket to compare)
```

and a good hash function exists to keep the second term small.

Picture the post room of a university department with a wall of pigeonholes, one per letter of the alphabet by surname. It works because surnames are spread across the alphabet; finding your mail means walking to the right hole (fast) and flipping through a few envelopes (fast). Now imagine the department instead sorted mail by *the number of letters in your surname*. Almost everyone's surname is 4 to 10 letters long, so seven pigeonholes are stuffed with hundreds of envelopes each while the rest sit empty. You still walk straight to the right hole, but then you're flipping through a stack.

With your million users and only 9 possible lengths (6 through 14), at most 9 buckets are ever used, so a typical bucket holds around a million / 9 ≈ 110,000 usernames, and a lookup compares against tens of thousands of them on average. That's no longer O(1); it's O(n) with a smaller constant, essentially a linear scan split into nine pieces. On a real server, the difference between comparing ~1 entry and ~50,000 entries per login is the difference between microseconds and milliseconds, multiplied by every request.

Try this one, which tests the same idea from the other side: the developer replaces the length-based hash with a good one but sets the table to only 16 buckets, permanently, for the same million users. What's the lookup cost now? And what do real hash table implementations (Python's `dict`, Java's `HashMap`) do to avoid this?

---

**Student:** Each bucket gets about a million/16 = 62,500, so it's still bad even though the hash is good. So they must grow the table as more items are added?

---

**Teacher:**

Exactly, and you've just found the second half of the O(1) promise. Real implementations track the *load factor*, entries per bucket. When it passes a threshold (Java's `HashMap` resizes at 0.75 by default), they allocate a larger table, typically double the size, and re-insert everything. That rehash costs O(n) when it happens, but since it happens after the table has doubled, the cost spread over all insertions is a constant per insertion. That's the same *amortised* argument as for a dynamic array growing, and it's worth seeing worked out with real numbers. Want to do that next?
