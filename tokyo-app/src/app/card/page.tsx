'use client'
import * as React from 'react';
import Card from '@/components/card';
import Cardlist from '@/components/cardlist';
import Textarea from '@/components/textarea';
import Sheet from '@/components/sheet';
import Datepicker from '@/components/datepicker';
import Container from '@/components/container';

import './layout_card.css'

export default function page() {
    return (
        <div className='dvide'>
            {/* <Container/>
            <Card avatar="A"/> */}
            {/* <Cardlist/> */}
            {/* <Datepicker/>
            <Textarea/> */}
            <Sheet/>
        </div>
    )
}