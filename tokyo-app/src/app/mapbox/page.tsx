'use client'

import * as React from 'react';
import Button from '@mui/material/Button';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import {useState, useMemo, useCallback,useRef,useEffect} from 'react';
import Map, { Marker,Popup,  MapRef,Source, Layer } from "react-map-gl";
import type {MapboxStyle, MapEvent, MapLayerMouseEvent, MarkerEvent} from 'react-map-gl';
import type {MarkerDragEvent, LngLat} from 'react-map-gl';
import bbox from '@turf/bbox';
import {dataLayer,lineLayer} from './map-style';
import Pin from '@/components/pin';

import Sheet from '@mui/joy/Sheet';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';


// import Sheet from '@/components/practice/sheet';
import RecommendPin from '@/components/recommendpin';
import RecommendSheet from '@/components/recommendsheet';

import "@/components/css/sheet.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "./style.css"

//おすすめ地点表示で使用
interface Mark {
    prefecture: string;
    lng:number;
    lat:number;  
    city: string;
    image: string;
    feature: string;
}

//ユーザの地点登録で使用
interface MoveMark{
    prefecture: string;
    lng: number;
    lat: number;
    city: string;
    startdate: string;
    enddate: string;
    text: string;
}


function App() {

    const [allData, setAllData] = useState(null); //日本地図のポリゴンデータ(japan.json)
    const [recommendData,setRecommendData] = useState(null); //おすすめ地点のデータ(japan_recommend.json)
    const mapRef = useRef<MapRef>(); //Mapを表示

    const [recommendMarker,setRecommendMarker] = useState<Mark[]>([]); //おすすめ地点にMarkerを表示

    const [memoryMarker,setMemoryMarker] = useState<MoveMark[]>([]); //ユーザの登録地点にMarkerを表示
    const [marker, setMarker] = useState<MoveMark | null>(null);

    const [recommendsheet,setRecommendSheet] = useState<Mark>(); //おすすめ地点の情報をsheetに渡す

    const [isclicked,setIsclicked] = useState(false); //Mapのクリック位置で県・県外を判定
    const [enableHover, setEnableHover] = useState(true); //ホバーした県の色を変更するかどうか

    const [isclickedrecommend,setIsclickedrecommend] = useState(false); //おすすめ地点のMarkerをクリックしたか判定
    const [isclickedaddmemory,setIsclickedaddmemory] = useState(false); //おすすめ地点の登録ボタンを押した場合
    
    const [startdate, setStartdate] = React.useState<Dayjs | null>(dayjs('2023-07-01'));
    const [enddate, setEnddate] = React.useState<Dayjs | null>(dayjs('2023-07-01'));

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

    //Markerを動かせるように
    const onMarkerDrag = useCallback((event: MarkerDragEvent) => {    
        setMarker(prevMarker => ({
            ...prevMarker,
            lng: event.lngLat.lng,
            lat: event.lngLat.lat
          }));        
      }, []);


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
            setIsclickedaddmemory(false)
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
 
    //recommendマーカーをクリックした際に実行 recommend情報をsheetに表示する
    const MarkeronClick =  useCallback((marker:Mark) => {
        setRecommendSheet(marker)
        setIsclickedaddmemory(false)
        setMarker(null)
        setIsclickedrecommend(true)
    },[])

    const Addmemory = () => {
        setIsclickedrecommend(false)
        setIsclickedaddmemory(true);
        setMarker({
            lng: 145.2,
            lat: 44.2
        })

    }

    const Registermemory  = () => {
        setMemoryMarker(prev => (
            [...prev,{
                lng:marker.lng,
                lat:marker.lat,
                startdate: startdate,
                enddate: enddate
            }]
        ))
        
        setMarker(null)
    }

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
        // onMouseMove={onHover}
        onClick={onClick}              
        >
            
            <Source type="geojson" data={allData}>
            {[dataLayer, lineLayer].map((layer, index) => (
                <Layer key={index} {...layer} />
            ))}       
            </Source>

            {memoryMarker && memoryMarker.map((marker, index) => (
            <Marker 
                key={index}
                longitude={marker.lng}
                latitude={marker.lat}
                //クリック時に保存したデータを表示したい
                // onClick={}
            >
                <Pin size={20} />
            </Marker>
            ))}            

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
            {isclicked &&
                <div className='button'>
                    <Button className="addmemorybutton" variant="contained" onClick ={Addmemory} endIcon={<AddLocationAltIcon />}>
                    Add Memory
                    </Button>
                    {marker &&
                        <Marker
                        longitude={marker?.lng}
                        latitude={marker?.lat}
                        anchor="bottom"
                        draggable          
                        onDrag={onMarkerDrag}          
                        >
                        <Pin size={20} />
                        </Marker>                           
                    }
                </div>
            }            
        </Map>

        {isclickedrecommend &&
            <RecommendSheet {...recommendsheet}/>
        }

        {/* {isclickedmemory&&} */}

        {isclickedaddmemory &&
            <Sheet className = "sheet" variant="outlined" color="neutral" sx={{ p: 4 }}>
                 <LocalizationProvider dateAdapter={AdapterDayjs}>                                            
                    <DatePicker
                    label="startdate"
                    value={startdate}
                    onChange={(newValue) => setStartdate(newValue)}
                    /> 
                    <DatePicker
                    label="startdate"
                    value={enddate}
                    onChange={(newValue) => setEnddate(newValue)}
                    />               
                </LocalizationProvider>
                <Button className="registerbutton" variant="contained" onClick ={Registermemory}  endIcon={<LocationOnIcon />}>
                register
                </Button>                  
             </Sheet>
        }        


    </div>
    );
}

export default App;