import numpy as np, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt

# ---------- 1-D: three clients, optima c_i ----------
c = np.array([0.0, 1.0, 10.0])
def fedavg(x0, kind, eta, K=5, R=4000):
    x = x0
    for r in range(R):
        locs = []
        for ci in c:
            xi = x
            for k in range(K):
                g = xi - ci
                d = -g if kind == "sgd" else -np.sign(g)
                xi = xi + eta * d
            locs.append(xi)
        x = np.mean(locs)
    return x
print("mean", c.mean(), "median", np.median(c))
for eta in [0.1, 0.01, 0.001]:
    print(f"eta={eta}: sgd->{fedavg(5.0,'sgd',eta,R=int(40/eta)):.4f}  norm->{fedavg(5.0,'norm',eta,R=int(40/eta)):.4f}")

xs = np.linspace(-2, 12, 800)
fig, ax = plt.subplots(2, 1, figsize=(8, 6.4), sharex=True)
cols = ["tab:blue", "tab:purple", "tab:red"]
for ci, col in zip(c, cols):
    ax[0].plot(xs, 0.5*(xs-ci)**2, color=col, alpha=.6, label=f"client loss fᵢ, optimum {ci:g}")
ax[0].plot(xs, np.mean([0.5*(xs-ci)**2 for ci in c], 0), "k", lw=2.5, label="global loss f = average")
ax[0].axvline(c.mean(), color="k", ls=":"); ax[0].set_ylim(0, 40); ax[0].set_ylabel("loss")
ax[0].legend(fontsize=8, loc="upper center"); ax[0].set_title("Three clients pulling one shared parameter x")
gd = -np.mean([xs-ci for ci in c], 0)
nm = -np.mean([np.sign(xs-ci) for ci in c], 0)
ax[1].plot(xs, gd/np.abs(gd).max(), "tab:green", lw=2, label="averaged SGD step  −(1/n)Σ(x−cᵢ)  (rescaled)")
ax[1].plot(xs, nm, "tab:orange", lw=2, label="averaged normalized step  −(1/n)Σ sign(x−cᵢ)")
ax[1].axhline(0, color="k", lw=.8)
ax[1].axvline(c.mean(), color="tab:green", ls=":"); ax[1].axvline(np.median(c), color="tab:orange", ls=":")
ax[1].annotate("zero at the MEAN 3.67\n(true optimum)", (c.mean(), 0), (5.2, 0.55), color="tab:green", arrowprops=dict(arrowstyle="->", color="tab:green"))
ax[1].annotate("zero at the MEDIAN 1", (1, 0), (1.6, -0.75), color="tab:orange", arrowprops=dict(arrowstyle="->", color="tab:orange"))
ax[1].set_xlabel("shared parameter x"); ax[1].set_ylabel("direction the server moves x"); ax[1].legend(fontsize=8, loc="upper right")
fig.tight_layout(); fig.savefig("fig1_mean_vs_median.png", dpi=150)

# ---------- 2-D: four clients, Euclidean-normalized local steps ----------
C = np.array([[0.0, 0.0], [1.0, 0.2], [0.4, 1.0], [6.0, 5.0]])
def wz(C, it=500):
    y = C.mean(0)
    for _ in range(it):
        w = 1/np.linalg.norm(C-y, axis=1); y = (w[:, None]*C).sum(0)/w.sum()
    return y
gm = wz(C); print("mean", C.mean(0), "geometric median", gm.round(3))
def traj(x0, kind, eta=0.05, K=5, R=300):
    x = np.array(x0, float); path = [x.copy()]
    for r in range(R):
        locs = []
        for ci in C:
            xi = x.copy()
            for k in range(K):
                g = xi - ci; n = np.linalg.norm(g)
                d = -g if kind == "sgd" else (-g/n if n > 1e-12 else 0*g)
                xi = xi + (eta*0.2 if kind == "sgd" else eta)*d
            locs.append(xi)
        x = np.mean(locs, 0); path.append(x.copy())
    return np.array(path)
fig, ax = plt.subplots(figsize=(7, 6))
gx, gy = np.meshgrid(np.linspace(-1.5, 7, 300), np.linspace(-1.5, 6.5, 300))
F = np.mean([0.5*((gx-a)**2+(gy-b)**2) for a, b in C], 0)
ax.contour(gx, gy, F, levels=15, colors="0.8", linewidths=.8)
for s in [(-1, 6), (6.5, -1), (-1, -1), (3.5, 6)]:
    p = traj(s, "sgd"); ax.plot(p[:, 0], p[:, 1], color="tab:green", lw=1.5)
    q = traj(s, "norm"); ax.plot(q[:, 0], q[:, 1], color="tab:orange", lw=1.5)
    ax.plot(*s, "ko", ms=4)
ax.scatter(*C.T, s=80, c=["tab:blue"]*3+["tab:red"], zorder=5, label="client optima cᵢ")
ax.plot(*C.mean(0), "*", ms=18, color="tab:green", mec="k", label=f"mean = true optimum ({C.mean(0)[0]:.2f}, {C.mean(0)[1]:.2f})")
ax.plot(*gm, "*", ms=18, color="tab:orange", mec="k", label=f"geometric median ({gm[0]:.2f}, {gm[1]:.2f})")
ax.plot([], [], color="tab:green", label="FedAvg with local SGD"); ax.plot([], [], color="tab:orange", label="FedAvg with local normalized steps")
ax.set_aspect("equal"); ax.legend(fontsize=8, loc="upper left"); ax.set_xlabel("x₁"); ax.set_ylabel("x₂")
ax.set_title("Same clients, same rounds: averaging normalized steps\nfinds the geometric median, not the optimum")
fig.tight_layout(); fig.savefig("fig2_geometric_median.png", dpi=150)

# ---------- error vs rounds for several step sizes ----------
fig, ax = plt.subplots(figsize=(7, 4))
for eta, ls in [(0.1, "-"), (0.01, "--"), (0.001, ":")]:
    for kind, col in [("sgd", "tab:green"), ("norm", "tab:orange")]:
        x = np.array([5.0, 5.0]); errs = []
        R = 3000
        for r in range(R):
            locs = []
            for ci in C:
                xi = x.copy()
                for k in range(5):
                    g = xi-ci; n = np.linalg.norm(g)
                    d = -g if kind == "sgd" else (-g/n if n > 1e-12 else 0*g)
                    xi = xi + eta*d
                locs.append(xi)
            x = np.mean(locs, 0); errs.append(np.linalg.norm(x-C.mean(0)))
        ax.semilogy(errs, ls, color=col, label=f"{'local SGD' if kind=='sgd' else 'local normalized'}, η={eta}")
        print(kind, eta, "final dist to optimum", round(errs[-1], 4))
ax.set_xlabel("communication round"); ax.set_ylabel("distance to true optimum (log)")
ax.set_title("Smaller steps fix SGD's error but not the normalized method's"); ax.legend(fontsize=7, ncol=2)
fig.tight_layout(); fig.savefig("fig3_bias_floor.png", dpi=150)
