# PS2-ifier for Blender 3.6 / 4.x
# Uso: Blender > workspace "Scripting" > Apri questo file > Run Script (Alt+P)
# Funziona sul modello appena importato (GLB/OBJ/FBX dal generatore 3D)
# e anche dopo Mixamo (FBX con scheletro e animazioni).

import bpy, os

# ---- IMPOSTAZIONI ----
TARGET_TRIS  = 4000      # triangoli totali del personaggio (PS2: 2000-6000)
TEX_SIZE     = 256       # lato massimo delle texture (128 = ancora più retro)
FLAT_SHADING = True      # facce piatte, look anni 2000
PIXEL_TEX    = True      # texture senza filtro (pixel netti)
EXPORT_PATH  = os.path.join(os.path.expanduser("~"), "Desktop", "personaggio_ps2.glb")
# ----------------------

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    raise Exception("Nessuna mesh nella scena: importa prima il modello.")

def tri_count(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)

total = sum(tri_count(o) for o in meshes)
print(f"Triangoli iniziali: {total}")

# 1. Riduzione poligoni proporzionale su ogni mesh
for o in meshes:
    bpy.context.view_layer.objects.active = o
    ratio = min(1.0, TARGET_TRIS / max(total, 1))
    if ratio < 1.0:
        m = o.modifiers.new("PS2_Decimate", 'DECIMATE')
        m.ratio = ratio
        m.use_collapse_triangulate = True
        # applica il modificatore (prima di eventuali Armature)
        with bpy.context.temp_override(object=o):
            bpy.ops.object.modifier_move_to_index(modifier=m.name, index=0)
            bpy.ops.object.modifier_apply(modifier=m.name)
    # 2. Ombreggiatura piatta
    for p in o.data.polygons:
        p.use_smooth = not FLAT_SHADING

print(f"Triangoli finali: {sum(tri_count(o) for o in meshes)}")

# 3. Texture piccole e senza filtro
for img in bpy.data.images:
    if img.size[0] == 0 or img.type != 'IMAGE':
        continue
    w, h = img.size
    s = TEX_SIZE / max(w, h)
    if s < 1.0:
        img.scale(max(1, int(w * s)), max(1, int(h * s)))
        img.pack()  # salva la versione ridotta dentro il file

for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and PIXEL_TEX:
            n.interpolation = 'Closest'
        if n.type == 'BSDF_PRINCIPLED':
            # niente riflessi moderni: superficie opaca
            if 'Roughness' in n.inputs:
                n.inputs['Roughness'].default_value = 1.0
            for k in ('Specular', 'Specular IOR Level'):
                if k in n.inputs:
                    n.inputs[k].default_value = 0.0

# 4. Export GLB (include scheletro e animazioni se presenti)
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    export_animations=True,
    export_apply=True,
)
print("Esportato:", EXPORT_PATH)
