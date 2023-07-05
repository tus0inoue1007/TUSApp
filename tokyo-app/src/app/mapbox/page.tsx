'use client'

import * as React from 'react';
import {render} from 'react-dom';
import Card from '@/components/card';
import {useState, useMemo, useCallback,useRef,useEffect} from 'react';
import Map, { Marker,Popup,  MapRef,Source, Layer } from "react-map-gl";
import type {MapboxStyle, MapLayerMouseEvent} from 'react-map-gl';
import type {MarkerDragEvent, LngLat} from 'react-map-gl';
import bbox from '@turf/bbox';
import {dataLayer,lineLayer} from './map-style';
// import Pin from './pin';
import Pin from '@/components/pin';
import RecommendPin from '@/components/recommendpin';
import RecommendSheet from '@/components/recommendsheet';
import SimpleBox from '@/components/simplebox';
import Sheet from '@/components/sheet';
import axios from 'axios'

import "mapbox-gl/dist/mapbox-gl.css";
import "./style.css"

interface Mark {
  lng:number;
  lat:number;
}
interface SheetInfo  {
  prefecture: string;
  image: string;
  city: string;
  feature: string;
}

function App() {

  const [allData, setAllData] = useState(null);
  const [recommendData,setRecommendData] = useState(null);
  const mapRef = useRef<MapRef>();
  const [marker, setMarker] = useState<Mark | null>(null);
  const [recommendMarker,setRecommendMarker] = useState<Mark[]>([]);
  const [recommendInfo,setRecommendInfo] = useState<SheetInfo>({
    prefecture: "",
    image: "",
    city: "",
    feature: ""
  });
  const [isclicked,setIsclicked] = useState(false);
  const [isclickedrecommend,setIsclickedrecommend] = useState(false);
  const [clickedprefecture,setClickedprefecture] =useState<number>(0);
  const [enableHover, setEnableHover] = useState(true);



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
          // setRecommendMarker([...recommendMarker,{lng:data.features[0].geometry.coordinates[0][0],lat:data.features[0].geometry.coordinates[0][1]}])   
          // setRecommendInfo(
          //   {
          //     prefecture: data.features[0].properties.name,
          //     image: data.features[0].properties.positions[0].image,
          //     city: data.features[0].properties.positions[0].city,
          //     feature:  data.features[0].properties.positions[0].feature,
          //   }
          // )                          
          setRecommendData(data)
        }
        )
      .catch(error => console.error(error));
  }, []);


  const onMarkerDragStart = useCallback((event: MarkerDragEvent) => {
    // logEvents(_events => ({..._events, onDragStart: event.lngLat}));
  }, []);
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    // logEvents(_events => ({..._events, onDrag: event.lngLat}));
    setMarker({
      lng: event.lngLat.lng,
      lat: event.lngLat.lat
    });
  }, []);
  const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    // logEvents(_events => ({..._events, onDragEnd: event.lngLat}));
  }, []);

  const MarkeronClick = () => {
    setIsclickedrecommend(true)
    console.log("markeronclick",recommendInfo)
    // setRecommendMarker([...recommendMarker,{lng:recommendData.features[0].geometry.coordinates[0][0],lat:recommendData.features[0].geometry.coordinates[0][1]}])   
    // setRecommendInfo(
    //   {
    //     prefecture: recommendData.features[0].properties.name,
    //     image: recommendData.features[0].properties.positions[0].image,
    //     city: recommendData.features[0].properties.positions[0].city,
    //     feature:  recommendData.features[0].properties.positions[0].feature,
    //   }
    // )                 
    // console.log(recommendInfo)
    // console.log(recommendMarker)
    // const res = axios.get(`/api/map/${clickedprefecture}`)
    // console.log(res)
  }


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
      });
      const updatedData = {
        ...allData,
        features: updatedFeatures,
      };
      setAllData(updatedData);
    } 

  //マウス操作時に実行
  const onHover = useCallback(event => {
    if(enableHover){
      const { features, point: { x, y } } = event;
      //都道府県をクリックした場合
      if (features && features.length > 0) {
        const prefecture =features[0].properties.pref;
        Changecolor(prefecture)
      } else {
        Changecolor(false)
      }
    }
  }, [allData,enableHover]);

  const onClick = useCallback((event: MapLayerMouseEvent) => {  

    const feat = event.features[0];       
    if (feat) {
      const prefecture =feat.properties?.pref;
      setClickedprefecture(prefecture)
      Changecolor(prefecture)
      setEnableHover(false) 
      setIsclicked(true)

      setRecommendMarker([...recommendMarker,{lng:recommendData.features[0].geometry.coordinates[0][0],lat:recommendData.features[0].geometry.coordinates[0][1]}])   
      setRecommendInfo(
        {
          prefecture: recommendData.features[prefecture-1].properties.name,
          image: recommendData.features[prefecture-1].properties.positions[0].image,
          city: recommendData.features[prefecture-1].properties.positions[0].city,
          feature:  recommendData.features[prefecture-1].properties.positions[0].feature,
        }
      )

      console.log("recommendData",recommendData)
      console.log("recommendInfo",recommendInfo)
      console.log("recommendMarker",recommendMarker)





      //zoomを操作
      const [minLng, minLat, maxLng, maxLat] = bbox(feat);

      const avgLng = (minLng + maxLng) / 2;
      const avgLat = (minLat + maxLat) / 2;
      setMarker({ lng: avgLng, lat: avgLat });

      mapRef.current?.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        {padding: 40, duration: 1000}
      );
    }else {
      const [minLng, minLat, maxLng, maxLat] = bbox(allData);
      setEnableHover(true)
      setIsclicked(false)
      setMarker(null)
      setIsclickedrecommend(false)
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
            onClick={MarkeronClick}
          >
            <RecommendPin size={20} />
          </Marker>
        ))
        }      

        {marker &&
          <Marker
          longitude={marker?.lng}
          latitude={marker?.lat}
          anchor="bottom"
          draggable
          onDragStart={onMarkerDragStart}
          onDrag={onMarkerDrag}
          onDragEnd={onMarkerDragEnd}
          >
            <Pin size={20} />
          </Marker>
        }
        <div className='paperposition'>
         <SimpleBox/>
        </div>
      </Map>

      {isclickedrecommend &&
        <RecommendSheet {...recommendInfo}/>
      }


    </div>
  );
}

export default App;