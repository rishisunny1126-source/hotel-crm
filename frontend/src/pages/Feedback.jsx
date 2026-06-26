import ResourcePage from '../components/ui/ResourcePage';
export default function Feedback() {
  return (
    <ResourcePage title="Feedback" subtitle="Guest ratings & comments" endpoint="/feedback"
      writeRoles={['admin','manager','front_desk']}
      filters={[{name:'rating',label:'Rating',options:['1','2','3','4','5']}]}
      columns={[{key:'rating',label:'Rating'},{key:'comments',label:'Comments'},{key:'created_at',label:'Date'}]}
      fields={[{name:'guest_id',label:'Guest ID (UUID)'},{name:'booking_id',label:'Booking ID (UUID)'},{name:'rating',label:'Rating (1-5)',type:'number',required:true},{name:'comments',label:'Comments',type:'textarea'}]} />
  );
}
