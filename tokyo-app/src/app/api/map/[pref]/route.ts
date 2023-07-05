'use client'
import * as React from 'react';
import {useState, useMemo, useCallback,useRef,useEffect} from 'react';

interface SheetInfo  {
    prefecture: string;
    image: string;
    city: string;
    feature: string;
}
export const GET = (req:Request,{params}:{params:{pref:number}}) => {

    // const body = req.json()

    const {pref} = params

    const [recommendData,setRecommendData] = useState<SheetInfo[]>([]);
    // const [returnrecommend,setReturnrecommend] = useState<Mark[]>([]);

    fetch('/japan_recommend.json')
    .then(response => response.json())
    .then(data =>
      {            
      // setRecommendData([
      //   {
      //   prefecture: data.features[pref-1].properties.name,
      //   image: data.features[pref-1].properties.positions[0].image,
      //   city: data.features[pref-1].properties.positions[0].city,
      //   feature:  data.features[pref-1].properties.positions[0].feature,              
      //   },
      //   {
      //     prefecture: data.features[pref-1].properties.name,
      //     image: data.features[pref-1].properties.positions[1].image,
      //     city: data.features[pref-1].properties.positions[1].city,
      //     feature:  data.features[pref-1].properties.positions[1].feature,              
      //   },
      //   {
      //     prefecture: data.features[pref-1].properties.name,
      //     image: data.features[pref-1].properties.positions[2].image,
      //     city: data.features[pref-1].properties.positions[2].city,
      //     feature:  data.features[pref-1].properties.positions[2].feature,              
      //     },
      // ])              
      setRecommendData(data)
      }
      )
    .catch(error => console.error(error));
    // useEffect(() => {
    //     fetch('/japan_recommend.json')
    //       .then(response => response.json())
    //       .then(data =>
    //         {            
    //         setRecommendData(
    //           [
    //           {
    //           prefecture: data.features[pref-1].properties.name,
    //           image: data.features[pref-1].properties.positions[0].image,
    //           city: data.features[pref-1].properties.positions[0].city,
    //           feature:  data.features[pref-1].properties.positions[0].feature,              
    //           },
    //           {
    //             prefecture: data.features[pref-1].properties.name,
    //             image: data.features[pref-1].properties.positions[1].image,
    //             city: data.features[pref-1].properties.positions[1].city,
    //             feature:  data.features[pref-1].properties.positions[1].feature,              
    //           },
    //           {
    //             prefecture: data.features[pref-1].properties.name,
    //             image: data.features[pref-1].properties.positions[2].image,
    //             city: data.features[pref-1].properties.positions[2].city,
    //             feature:  data.features[pref-1].properties.positions[2].feature,              
    //             },
    //         ])              
    //         setRecommendData(data)
    //         }
    //         )
    //       .catch(error => console.error(error));
    //   }, []);

    return pref
}