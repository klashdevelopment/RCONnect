// 3x1 cube scene build in three.js 
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, KeyboardControls, PointerLockControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Player } from './world/player';
import { Physics } from '@react-three/rapier';

const WorldMesh = () => {
    //   React component:
    // return (
    //     <>
    //         {cells.map((details: any, index: number) => {
    //             return (
    //                 <Box key={index} position={details.position} />
    //             );
    //         })}
    //     </>
    // );
    class VoxelWorld {

        cellSize: any;
        tileSize: any;
        tileTextureWidth: any;
        tileTextureHeight: any;
        cellSliceSize: any;
        cell: any;

        constructor( options: any ) {
    
            this.cellSize = options.cellSize;
            this.tileSize = options.tileSize;
            this.tileTextureWidth = options.tileTextureWidth;
            this.tileTextureHeight = options.tileTextureHeight;
            const { cellSize } = this;
            this.cellSliceSize = cellSize * cellSize;
            this.cell = new Uint8Array( cellSize * cellSize * cellSize );
    
        }
        computeVoxelOffset( x: number, y: number, z: number ) {
    
            const { cellSize, cellSliceSize } = this;
            const voxelX = THREE.MathUtils.euclideanModulo( x, cellSize ) | 0;
            const voxelY = THREE.MathUtils.euclideanModulo( y, cellSize ) | 0;
            const voxelZ = THREE.MathUtils.euclideanModulo( z, cellSize ) | 0;
            return voxelY * cellSliceSize +
               voxelZ * cellSize +
               voxelX;
    
        }
        getCellForVoxel( x: number, y: number, z: number ) {
    
            const { cellSize } = this;
            const cellX = Math.floor( x / cellSize );
            const cellY = Math.floor( y / cellSize );
            const cellZ = Math.floor( z / cellSize );
            if ( cellX !== 0 || cellY !== 0 || cellZ !== 0 ) {
    
                return null;
    
            }
    
            return this.cell;
    
        }
        setVoxel( x: number, y: number, z: number, v: number ) {
    
            const cell = this.getCellForVoxel( x, y, z );
            if ( ! cell ) {
    
                return; // TODO: add a new cell?
    
            }
    
            const voxelOffset = this.computeVoxelOffset( x, y, z );
            cell[ voxelOffset ] = v;
    
        }
        getVoxel( x: number, y: number, z: number ) {
    
            const cell = this.getCellForVoxel( x, y, z );
            if ( ! cell ) {
    
                return 0;
    
            }
    
            const voxelOffset = this.computeVoxelOffset( x, y, z );
            return cell[ voxelOffset ];
    
        }

        declare static faces: any;
        generateGeometryDataForCell( cellX: number, cellY: number, cellZ: number ) {
    
            const { cellSize, tileSize, tileTextureWidth, tileTextureHeight } = this;
            const positions = [];
            const normals = [];
            const uvs = [];
            const indices = [];
            const startX = cellX * cellSize;
            const startY = cellY * cellSize;
            const startZ = cellZ * cellSize;
    
            for ( let y = 0; y < cellSize; ++ y ) {
    
                const voxelY = startY + y;
                for ( let z = 0; z < cellSize; ++ z ) {
    
                    const voxelZ = startZ + z;
                    for ( let x = 0; x < cellSize; ++ x ) {
    
                        const voxelX = startX + x;
                        const voxel = this.getVoxel( voxelX, voxelY, voxelZ );
                        if ( voxel ) {
    
                            // voxel 0 is sky (empty) so for UVs we start at 0
                            const uvVoxel = voxel - 1;
                            // There is a voxel here but do we need faces for it?
                            for ( const { dir, corners, uvRow } of VoxelWorld.faces ) {
    
                                const neighbor = this.getVoxel(
                                    voxelX + dir[ 0 ],
                                    voxelY + dir[ 1 ],
                                    voxelZ + dir[ 2 ] );
                                if ( ! neighbor ) {
    
                                    // this voxel has no neighbor in this direction so we need a face.
                                    const ndx = positions.length / 3;
                                    for ( const { pos, uv } of corners ) {
    
                                        positions.push( pos[ 0 ] + x, pos[ 1 ] + y, pos[ 2 ] + z );
                                        normals.push( ...dir );
                                        uvs.push(
                                            ( uvVoxel + uv[ 0 ] ) * tileSize / tileTextureWidth,
                                            1 - ( uvRow + 1 - uv[ 1 ] ) * tileSize / tileTextureHeight );
    
                                    }
    
                                    indices.push(
                                        ndx, ndx + 1, ndx + 2,
                                        ndx + 2, ndx + 1, ndx + 3,
                                    );
    
                                }
    
                            }
    
                        }
    
                    }
    
                }
    
            }
    
            return {
                positions,
                normals,
                uvs,
                indices,
            };
    
        }
    
    }
    
    VoxelWorld.faces = [
        { // left
            uvRow: 0,
            dir: [ - 1, 0, 0, ],
            corners: [
                { pos: [ 0, 1, 0 ], uv: [ 0, 1 ], },
                { pos: [ 0, 0, 0 ], uv: [ 0, 0 ], },
                { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
                { pos: [ 0, 0, 1 ], uv: [ 1, 0 ], },
            ],
        },
        { // right
            uvRow: 0,
            dir: [ 1, 0, 0, ],
            corners: [
                { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
                { pos: [ 1, 0, 1 ], uv: [ 0, 0 ], },
                { pos: [ 1, 1, 0 ], uv: [ 1, 1 ], },
                { pos: [ 1, 0, 0 ], uv: [ 1, 0 ], },
            ],
        },
        { // bottom
            uvRow: 0,
            dir: [ 0, - 1, 0, ],
            corners: [
                { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
                { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
                { pos: [ 1, 0, 0 ], uv: [ 1, 1 ], },
                { pos: [ 0, 0, 0 ], uv: [ 0, 1 ], },
            ],
        },
        { // top
            uvRow: 0,
            dir: [ 0, 1, 0, ],
            corners: [
                { pos: [ 0, 1, 1 ], uv: [ 1, 1 ], },
                { pos: [ 1, 1, 1 ], uv: [ 0, 1 ], },
                { pos: [ 0, 1, 0 ], uv: [ 1, 0 ], },
                { pos: [ 1, 1, 0 ], uv: [ 0, 0 ], },
            ],
        },
        { // back
            uvRow: 0,
            dir: [ 0, 0, - 1, ],
            corners: [
                { pos: [ 1, 0, 0 ], uv: [ 0, 0 ], },
                { pos: [ 0, 0, 0 ], uv: [ 1, 0 ], },
                { pos: [ 1, 1, 0 ], uv: [ 0, 1 ], },
                { pos: [ 0, 1, 0 ], uv: [ 1, 1 ], },
            ],
        },
        { // front
            uvRow: 0,
            dir: [ 0, 0, 1, ],
            corners: [
                { pos: [ 0, 0, 1 ], uv: [ 0, 0 ], },
                { pos: [ 1, 0, 1 ], uv: [ 1, 0 ], },
                { pos: [ 0, 1, 1 ], uv: [ 0, 1 ], },
                { pos: [ 1, 1, 1 ], uv: [ 1, 1 ], },
            ],
        },
    ];
    const cellSize = 16;
    const tileSize = 16;
	const tileTextureWidth = 16;
	const tileTextureHeight = 16;
	const world = new VoxelWorld( {
		cellSize,
		tileSize,
		tileTextureWidth,
		tileTextureHeight,
	} );

	for ( let y = 0; y < cellSize; ++ y ) {

		for ( let z = 0; z < cellSize; ++ z ) {

			for ( let x = 0; x < cellSize; ++ x ) {

				const height = ( Math.sin( x / cellSize * Math.PI * 2 ) + Math.sin( z / cellSize * Math.PI * 3 ) ) * ( cellSize / 6 ) + ( cellSize / 2 );
				if ( y < height ) {

					world.setVoxel( x, y, z, 1 );

				}

			}

		}

	}

	function randInt( min: number, max: number ) {

		return Math.floor( Math.random() * ( max - min ) + min );

	}

	const { positions, normals, uvs, indices } = world.generateGeometryDataForCell( 0, 0, 0 );
	const geometry = new THREE.BufferGeometry();
	const material = new THREE.MeshLambertMaterial( {
		map: block("dirt.png"),
		side: THREE.DoubleSide,
		alphaTest: 0.1,
		transparent: true,
	} );

	const positionNumComponents = 3;
	const normalNumComponents = 3;
	const uvNumComponents = 2;
	geometry.setAttribute(
		'position',
		new THREE.BufferAttribute( new Float32Array( positions ), positionNumComponents ) );
	geometry.setAttribute(
		'normal',
		new THREE.BufferAttribute( new Float32Array( normals ), normalNumComponents ) );
	geometry.setAttribute(
		'uv',
		new THREE.BufferAttribute( new Float32Array( uvs ), uvNumComponents ) );
	geometry.setIndex( indices );
	return (
        <mesh geometry={geometry} material={material} position={[0,0,0]} />
    )
}

function javaBlock(name: string) {
    return `https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.20.6/assets/minecraft/textures/block/${name}`;
}
function block(name: string) {
    const texture = new THREE.TextureLoader().load(javaBlock(name));
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function materialArray(nameTop: string, nameSide: string) {
    return [
        new THREE.MeshLambertMaterial({map: block(nameSide), side: THREE.DoubleSide, transparent: true}),
        new THREE.MeshLambertMaterial({map: block(nameSide), side: THREE.DoubleSide, transparent: true}),
        new THREE.MeshLambertMaterial({map: block(nameTop), side: THREE.DoubleSide, transparent: true}),
        new THREE.MeshLambertMaterial({map: block(nameSide), side: THREE.DoubleSide, transparent: true}),
        new THREE.MeshLambertMaterial({map: block(nameSide), side: THREE.DoubleSide, transparent: true}),
        new THREE.MeshLambertMaterial({map: block(nameSide), side: THREE.DoubleSide, transparent: true}),
    ];
}

function Box(props: any) {
    const meshRef = useRef()
    return (
        <mesh
            {...props}
            ref={meshRef}
            material={materialArray('grass_block_top.png', 'grass_block_side.png')}
            scale={1}>
            <boxGeometry args={[1, 1, 1]} />
        </mesh>
    )
}

export function Scene() {
    return (
        <>
        <KeyboardControls
        map={[
            { name: "forward", keys: ["ArrowUp", "w", "W"] },
            { name: "backward", keys: ["ArrowDown", "s", "S"] },
            { name: "left", keys: ["ArrowLeft", "a", "A"] },
            { name: "right", keys: ["ArrowRight", "d", "D"] },
            { name: "jump", keys: ["Space"] },
        ]}>
            <Canvas shadows camera={{ fov: 45 }} style={{ width: '100%', height: 'calc(100% - 20px)',borderBottomLeftRadius:'10px',borderBottomRightRadius:'10px',position:'absolute',top:'20px',left:'0', background: 'lightblue' }}>
                <ambientLight />
                <pointLight position={[0, 4, 0]} intensity={5} />
                {/* <Physics gravity={[0, 0, 0]}>
                    <Player />
                </Physics> */}
                <OrbitControls />
                <WorldMesh/>
                {/* <PointerLockControls /> */}
            </Canvas>
        </KeyboardControls>
        </>
    );
}