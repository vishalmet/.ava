from ursina import *
from ursina.prefabs.first_person_controller import FirstPersonController

app = Ursina()

# Define a function to create a voxel
def create_voxel(position=(0, 0, 0)):
    import random
    return Button(
        parent=scene,
        position=position,
        model='cube',
        origin_y=0.5,
        texture='white_cube',
        color=color.hsv(0, 0, random.uniform(0.9, 1.0)),
        highlight_color=color.lime,
    )

# Create voxels in a grid pattern
for z in range(8):
    for x in range(8):
        voxel = create_voxel(position=(x, 0, z))

# Define the input function to handle mouse clicks and escape key
def input(key):
    if key == 'left mouse down':
        hit_info = raycast(camera.world_position, camera.forward, distance=5)
        if hit_info.hit:
            create_voxel(position=hit_info.entity.position + hit_info.normal)

    if key == 'right mouse down' and mouse.hovered_entity:
        destroy(mouse.hovered_entity)

player = FirstPersonController()

app.run()
