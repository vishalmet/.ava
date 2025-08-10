# 08. Proof-of-Work (PoW)

PoW helpers search for a nonce so that `sha256(data + nonce)` has a given number of leading zero bits.

## Manual mining
```ava
pow_mine("hello", 18)            # returns [nonce, hash, iterations, elapsed]
# Expected: prints periodic progress and final result array
```

- Larger `bits` increases difficulty exponentially
- During search, periodic progress is printed: iterations and hash rate

```ava
var res = pow_mine("Ava", 16)
show(res)
# Expected: [nonce, "hexhash...", iterations, seconds]
```

## Automatic PoW after each command
```ava
pow_cfg(1, 18)                     # enable auto-PoW
a = 1 + 1                          # after this runs, auto PoW will mine and print a summary
pow_cfg(0, 0)                      # disable
```

## Tuning the search space
```ava
pow_max_nonce(200000)              # lower max nonce for quicker failure
pow_mine("x", 20)
# Expected: may not find a nonce; still prints a result with nonce = -1
```

## Performance notes
- Hash rate depends on your CPU; progress lines show iterations/sec
- Difficulty 18–20 is good for demos; 24+ may take long
- The REPL shows a PoW panel summarizing bits, nonce, hash prefix, iterations, time, and hash rate

## Practice
1) Try bits 12, 16, 18 and compare elapsed time.
2) Set `pow_max_nonce(50000)` and observe behavior when not found.
3) Enable `pow_cfg(1, 14)` and run a short program; then disable.
