# Manim Community Edition scene (NOT rendered here: Manim isn't installed).
# Render with:  manim -pql orthogonalize_scene.py GvsO
# Shows the unit circle being carried through Vᵀ, then Σ (stretch 2.5 and 0.5), then U,
# and then replays the same thing with Σ replaced by I, the orthogonalized update O = UVᵀ.
from manim import *
import numpy as np

x1, x2 = np.array([.8, .6]), np.array([-.6, .8])     # unit input directions (examples 1 and 2)
d1, d2 = np.array([1.5, 2.0]), np.array([.4, -.3])    # their backpropagated errors
V = np.column_stack([x1, x2]); U = np.column_stack([d1/2.5, d2/.5]); S = np.diag([2.5, .5])

class GvsO(LinearTransformationScene):
    def __init__(self, **kw):
        super().__init__(show_coordinates=False, leave_ghost_vectors=False,
                         include_background_plane=True, **kw)
    def run(self, stretch, label):
        title = MathTex(label).to_corner(UL).add_background_rectangle()
        self.add(title)
        circ = Circle(radius=1, color=GREY); self.add_transformable_mobject(circ)
        a = self.add_vector(x1, color=BLUE); b = self.add_vector(x2, color=GREEN)
        self.wait()
        for M in (V.T, stretch, U):
            self.apply_matrix(M); self.wait()
        self.wait(2)
    def construct(self):
        self.run(S, r"G = U\Sigma V^\top")

class OrthogonalizedO(GvsO):
    def construct(self):
        self.run(np.eye(2), r"O = U\,I\,V^\top")
# manim -pql orthogonalize_scene.py OrthogonalizedO
