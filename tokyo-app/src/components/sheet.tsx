import Sheet from '@mui/joy/Sheet';
import Textarea from '@/components/textarea';
import Datepicker from '@/components/datepicker';
import Timepicker from '@/components/timepicker';
import Timeline from '@/components/timeline';
import Cardjoy from '@/components/card_joy';
import Cardlist from '@/components/cardlist';
export default function MyApp() {
    const label = ["start","end"];
    const onClick = {

    }    
  return (
    <Sheet variant="outlined" color="neutral" sx={{ p: 4 }}>
        Prefecture
        <Textarea text="Click"/>
        City
        <Textarea text="Type in here"/>
        {label.map((text) => (
            <Datepicker key={text} text={text} />
        ))}                
        <Cardlist/>
    </Sheet>
  )
}