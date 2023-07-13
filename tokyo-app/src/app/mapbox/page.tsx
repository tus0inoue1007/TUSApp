'use client'

import * as React from 'react';
import {useState, useMemo, useCallback,useRef,useEffect} from 'react';
import Map, { Marker,Popup,  MapRef,Source, Layer } from "react-map-gl";
import type {MapboxStyle, MapEvent, MapLayerMouseEvent, MarkerEvent} from 'react-map-gl';
import type {MarkerDragEvent, LngLat} from 'react-map-gl';
import bbox from '@turf/bbox';
import {dataLayer,lineLayer} from './map-style';
import Pin from '@/components/pin';
import RecommendPin from '@/components/recommendpin';
import RecommendSheet from '@/components/recommendsheet';

import "mapbox-gl/dist/mapbox-gl.css";
import "./style.css"

interface Mark {
    prefecture: string;
    lng:number;
    lat:number;  
    city: string;
    image: string;
    feature: string;
}


function App() {

    const [allData, setAllData] = useState(null); //日本地図のポリゴンデータ(japan.json)
    const [recommendData,setRecommendData] = useState(null); //おすすめ地点のデータ(japan_recommend.json)
    const mapRef = useRef<MapRef>(); //Mapを表示

    const [recommendMarker,setRecommendMarker] = useState<Mark[]>([]); //おすすめ地点にMarkerを表示
    const [recommendsheet,setRecommendSheet] = useState<Mark>(); //おすすめ地点の情報をsheetに渡す

    const [isclicked,setIsclicked] = useState(false); //Mapのクリック位置で県・県外を判定
    const [isclickedrecommend,setIsclickedrecommend] = useState(false); //おすすめ地点のMarkerをクリックしたか判定
    const [enableHover, setEnableHover] = useState(true); //ホバーした県の色を変更するかどうか
    

    // #################################### データの読み込み ############################
    useEffect(() => {
        fetch('/japan.json')
        .then(response => response.json())
        .then(data => setAllData(data))
        .catch(error => console.error(error));
    }, []);
    useEffect(() => {
        fetch('/japan_recommend.json')
        .then(response => response.json())
        .then(data =>
            {                      
            setRecommendData(data)
            }
            )
        .catch(error => console.error(error));
    }, []);
    // ################################################################


    //都道府県の色を変更する
    const Changecolor = (prefecture) => {   
        const updatedFeatures = allData.features.map(feature => {
            //県の場合、一致する箇所の色を変える
            if(prefecture){
                if (feature.properties.pref === prefecture) {         
                const updatedProperties = {
                    ...feature.properties,
                    percentile: 2,
                };
                return {
                    ...feature,
                    properties: updatedProperties,
                };
                } else if (feature.properties.percentile) {
                const updatedProperties = {
                    ...feature.properties,
                    percentile: 1,
                };
                return {
                    ...feature,
                    properties: updatedProperties,
                };
                }
                return feature;
            }else{ //存在しない場合は全てを1にする
                const updatedProperties = {
                ...feature.properties,
                percentile: 1,
                };
                return {
                ...feature,
                properties: updatedProperties,
                };
            }
        });//各都道府県の色を変更する

        const updatedData = {
        ...allData,
        features: updatedFeatures,
        };

        setAllData(updatedData);
    } 

    //マウスをホバーした際に実行 (県上なら色を変える、県外なら何もしない)
    const onHover = useCallback(event => {
        if(enableHover){
            const { features, point: { x, y } } = event;
            //マウスが県上なら
            if (features && features.length > 0) {
                const prefecture =features[0].properties.pref;
                Changecolor(prefecture)
            } else { //県外なら
                Changecolor(false)
            }
        }
    }, [allData,enableHover]);

    //マウスをクリックした際に実行 (県上なら色を変えて拡大、県外なら初期画面に戻す)
    const onClick = useCallback((event: MapLayerMouseEvent) => {  
        const feat = event.features[0];    
        //県上をクリックした場合   
        if (feat) 
        {
            const prefecture =feat.properties?.pref; //県を表す数字
            Changecolor(prefecture) //色を変える
            setEnableHover(false) //ホバーをなくす
            setIsclicked(true)  //クリックした県のおすすめ地点Markerを表示する

            recommendData.features[prefecture-1].properties.positions.map((data,index)=>(
                setRecommendMarker(prevMarkers => [
                    ...prevMarkers,
                    {
                      prefecture: feat.properties?.name,
                      lng: recommendData.features[prefecture-1].geometry.coordinates[index][0],
                      lat: recommendData.features[prefecture-1].geometry.coordinates[index][1],
                      city: data.city,
                      image: data.image,
                      feature: data.feature
                    }
                ])
            ));
            //zoomを操作 クリックした県を拡大表示する
            const [minLng, minLat, maxLng, maxLat] = bbox(feat);           
            mapRef.current?.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat]
            ],
            {padding: 40, duration: 1000}
            );
        }
        else //県外をクリックした場合は初期状態に戻す
        {
            const [minLng, minLat, maxLng, maxLat] = bbox(allData);
            setEnableHover(true) //ホバーを戻す
            setIsclicked(false) //おすすめ地点のMarkerを消す
            setIsclickedrecommend(false) //おすすめ情報のsheetをなくす
            const japanBounds = [
            [122, 20],
            [154, 45] 
            ];
            mapRef.current.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat]
            ],
            { padding: 40, duration: 1000, maxZoom: 5, bounds: japanBounds }
            );
        }
    },[allData]);
 
    //マーカーをクリックした際に実行 recommend情報をsheetに表示する
    const MarkeronClick =  useCallback((marker:Mark) => {
        setRecommendSheet(marker)
        setIsclickedrecommend(true)
    },[])

    return (
    <div className='content'>
        <Map
        className = "map"
        ref={mapRef}
        initialViewState={{
            longitude: 139,
            latitude: 37.5,
            zoom: 4.5,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESSS_TOKEN}
        style={{ width: "70vw", height: "100vh" }}
        interactiveLayerIds={['data']}
        onMouseMove={onHover}
        onClick={onClick}              
        >
            
            <Source type="geojson" data={allData}>
            {[dataLayer, lineLayer].map((layer, index) => (
                <Layer key={index} {...layer} />
            ))}       
            </Source>
            
            {isclicked &&
            recommendMarker?.map((marker, index) => (
                <Marker 
                key={index}
                longitude={marker.lng}
                latitude={marker.lat}
                onClick={() => MarkeronClick(marker)}
                >
                <RecommendPin size={20} />
                </Marker>
            ))
            }

        </Map>

        {isclickedrecommend &&
            <RecommendSheet {...recommendsheet}/>
        }

    </div>
    );
}

export default App;