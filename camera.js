import React, { useEffect, useState } from 'react'
import { TouchableOpacity, Image, Text, View, Button, SafeAreaView } from 'react-native'
import { Audio } from 'expo-av'

import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

import { useIsFocused } from '@react-navigation/core'
import { Feather } from '@expo/vector-icons'

import styles from './styles'

export default function CameraScreen() {
    const [hasCameraPermissions, setHasCameraPermissions] = useState(false)
    const [hasAudioPermissions, setHasAudioPermissions] = useState(false)

    const [photo, setPhoto] = useState();
    const [video, setVideo] = useState();
    const [faceData, setFaceData] = React.useState([]);

    const [cameraRef, setCameraRef] = useState(null)
    const [cameraType, setCameraType] = useState(Camera.Constants.Type.back)
    const [cameraFlash, setCameraFlash] = useState(Camera.Constants.FlashMode.off)

    const [isCameraReady, setIsCameraReady] = useState(false)
    const isFocused = useIsFocused()

    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync()
            setHasCameraPermissions(cameraStatus.status == 'granted')

            const audioStatus = await Audio.requestPermissionsAsync()
            setHasAudioPermissions(audioStatus.status == 'granted')
        })()
    }, [])

    const recordVideo = async () => {
        if (cameraRef) {
            try {
                const options = { maxDuration: 60, quality: Camera.Constants.VideoQuality['480'] }
                const videoRecordPromise = cameraRef.recordAsync(options)
                if (videoRecordPromise) {
                    const data = await videoRecordPromise;
                    const source = data.uri
                }
            } catch (error) {
                console.warn(error)
            }
        }
    }

    const handleFacesDetected = ({ faces }) => {
        setFaceData(faces);
    }


    const clickPic = async () => {
        let options = {
            quality: 1,
            base64: true,
            exif: false
        };

        let newPhoto = await cameraRef.current.takePictureAsync(options);
        setPhoto(newPhoto);
    }

    if (photo) {
        let sharePic = () => {
            shareAsync(photo.uri).then(() => {
                setPhoto(undefined);
            });
        };

        let savePhoto = () => {
            MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {
                setPhoto(undefined);
            });
        };

        return (
            <SafeAreaView style={styles.container}>
                <Image style={styles.preview} source={{ uri: "data:image/jpg;base64," + photo.base64 }} />
                <Button title="Share" onPress={sharePic} />
                {hasMediaLibraryPermission ? <Button title="Save" onPress={savePhoto} /> : undefined}
                <Button title="Discard" onPress={() => setPhoto(undefined)} />
            </SafeAreaView>
        );
    }


    const stopVideo = async () => {
        if (cameraRef) {
            cameraRef.stopRecording()
        }
    }

    if (!hasCameraPermissions || !hasAudioPermissions) {
        return (
            <View></View>
        )
    }

    return (
        <View style={styles.container}>
            {isFocused ?
                <Camera
                    ref={ref => setCameraRef(ref)}
                    style={styles.camera}
                    ratio={'16:9'}
                    type={cameraType}
                    onFacesDetected={handleFacesDetected}
                    faceDetectorSettings={{
                        mode: FaceDetector.FaceDetectorMode.fast,
                        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                        runClassifications: FaceDetector.FaceDetectorClassifications.none,
                        minDetectionInterval: 100,
                        tracking: true
                    }}
                    flashMode={cameraFlash}
                    onCameraReady={() => setIsCameraReady(true)}
                />
                : null}

            <View style={styles.sideBarContainer}>
                <TouchableOpacity
                    style={styles.sideBarButton}
                    onPress={() => setCameraType(cameraType === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back)}>

                    <Feather name="refresh-ccw" size={24} color={'white'} />
                    <Text style={styles.iconText}>Flip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.sideBarButton}
                    onPress={() => setCameraFlash(cameraFlash === Camera.Constants.FlashMode.off ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off)}>

                    <Feather name="zap" size={24} color={'white'} />
                    <Text style={styles.iconText}>Flash</Text>
                </TouchableOpacity>
            </View>

            {faceData.length > 0 ?

                <View style={styles.bottomBarContainer}>
                    <View style={styles.recordButtonContainer}>
                        <TouchableOpacity
                            disabled={!isCameraReady}
                            onPress={() => clickPic()}
                            onLongPress={() => recordVideo()}
                            onPressOut={() => stopVideo()}
                            style={styles.recordButton}
                        />
                    </View>
                </View> : <></>}
        </View>
    )
}