import logo from './logo.svg';
import './App.css';
import React from 'react'
import axios from 'axios'
import spinner from './img/spinner.gif'

const apiUrl = 'https://marhulky.sk:8081/api'

const products = [
  {
    _id:1,
    name:'Veltlínske zelené',
    info:'suché, biele, 12.59% alk',
    price:8.5,
    priceWithTax:10.2
  },
  {
    _id:2,
    name:'Pinot blanc',
    info:'suché, biele, 13% alk',
    price:3,
    priceWithTax:5
  },
  {
    _id:3,
    name:'Frankovka modrá',
    info:'suché, červené, 12.5% alk',
    price:7,
    priceWithTax:8.4
  }
]

class App extends React.Component{
  render(){
    return <OrderForm></OrderForm>
  }
}

class OrderForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {products:products,displayedProducts:products,order:[],contactInfo:{},currentType:undefined}
    this.addToOrder = this.addToOrder.bind(this)
    this.removeFromOrder = this.removeFromOrder.bind(this)
    this.setCountOfProduct = this.setCountOfProduct.bind(this)
    this.filterProducts = this.filterProducts.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.createOrder = this.createOrder.bind(this)
    this.closeMessage = this.closeMessage.bind(this)
  }

  async filterProducts(type){
    let products
    if (type==='all'){
      products = await axios.get(apiUrl+'/products')
    }
    else {
      products = await axios.post(apiUrl+'/products/filter',{filters:{type:type}})
    }
    this.setState({displayedProducts:products.data.products,currentType:type})
  }

  addToOrder(id){
    const newOrder = this.state.order
    const product = this.state.products.find(prod => prod._id===id)
    if (newOrder.find(prod => prod._id===id)){
      newOrder.map(prod=>{
        if (prod._id === id){
          prod.count+=1
        }
        return prod
      })
    }
    else{
      newOrder.push({
        ...product,
        count:1
      })
    }
    this.setState({order:newOrder})
  }

  closeMessage(){
    this.setState({showLoader:false})
  }

  handleInputChange(type,value){
    console.log(type,value)
    let newInfo = {...this.state.contactInfo}
    newInfo[type] = value
    this.setState({
        contactInfo:newInfo
      })
      console.log(this.state)
  }

  removeFromOrder(id){
    let newOrder = this.state.order
    newOrder = newOrder.filter(prod=>prod._id!==id)
    this.setState({order:newOrder})
  }

  setCountOfProduct(id,count){
    if (count === 0){
      return this.removeFromOrder(id)
    }
    let newOrder = this.state.order
    newOrder = newOrder.map(prod=>{
     if ( prod._id === id ){
       prod.count = count
     }
     return prod
    })
    this.setState({order:newOrder})
  }
  async componentDidMount(){
    const products = await axios.get(apiUrl+'/products')
    this.setState({products:products.data.products,displayedProducts:products.data.products,currentType:'all',showLoader:false})
  }

  async createOrder(){
    const orderedProducts = [], orderedQuants = []
    for (const product of this.state.order){
      orderedProducts.push(product._id)
      orderedQuants.push(product.count)
    }
    if (this.state.order.length == 0)  return this.setState({showLoader:true,isLoading:false,loaderMessage:'Zvoľte si prosím aspoň jeden produkt'})
    if (this.state.contactInfo.gdpr !== true) return this.setState({showLoader:true,isLoading:false,loaderMessage:'Pred odoslaním objednávky musíte súhlasiť so spracovaním osobných údajov'})
    const data = {
      ...this.state.contactInfo,
      products:orderedProducts,
      quants:orderedQuants
    }
    this.setState({showLoader:true,isLoading:true})
    try{
      const res = await axios.post(apiUrl+'/orders',data)
      this.setState({isLoading:false,loaderMessage:'Ďakujeme za objednávku',afterExited:()=>{window.location.reload()}})
    }
    catch(err){
      this.setState({isLoading:false,loaderMessage:'Vyplňte prosím všetky údaje'})
    }
  }

  render() {
    const productsToRender = this.state.displayedProducts.map(product => {return <Product id={product._id} addToOrder={this.addToOrder} data={product}></Product>})
    const productSummariesToRender = this.state.order.map(product => {return <SummaryProduct
      id={product._id} 
      setCountOfProduct={this.setCountOfProduct}
      removeFromOrder={this.removeFromOrder} 
      data={product}></SummaryProduct>})
    return <div className='order-form'>
      <h2 className='order-heading'>Objednávka</h2>
      <ProductFilters active={this.state.currentType} filterProducts={this.filterProducts} />
      <div className='order-header'>
        <h3 className='product'>Produkt</h3>
        <h3 className='price top'>Cena</h3>
        <div className='ks'></div>
      </div>
      {productsToRender}
      <h2 style={{marginTop:'40px'}} className='summary-heading'>Košík</h2>
      <div className='order-header'>
        <h3 className='product'>Produkt</h3>
        <h3 className='price'>Cena</h3>
        <h3 className='ks'>Ks.</h3>
      </div>
      {productSummariesToRender}
      <PriceSummary order={this.state.order}></PriceSummary>
      <ContactForm handleInputChange={this.handleInputChange}/>
      <div className='orderButton' onClick={this.createOrder} >Objednať</div>
      {this.state.showLoader && <Loader closeMessage={this.closeMessage} isLoading={this.state.isLoading} message={this.state.loaderMessage} afterExited={this.state.afterExited}/>}
    </div>
  }
}

class PriceSummary extends React.Component{
  render(){
    const order = this.props.order
    const priceWithoutTax = order.reduce((ac,prod) => {
      return ac+prod.price*prod.count
    },0).toFixed(2)+'€'
    const priceWithTax = order.reduce((ac,prod) => {
      return ac+prod.priceWithTax*prod.count
    },0).toFixed(2)+'€'
    return(
    <div className='price-summary'>
    <div className="price-block">
      <div>Cena bez DPH</div>
      <div className='price'>{priceWithoutTax}</div>
    </div>
    <div className="price-block">
      <div>Cena s DPH</div>
      <div className='price'>{priceWithTax}</div>
    </div>
    </div>
    )
  }
}

class Product extends React.Component{
  render(){
    return (
      <div className='product-cont'>
        <img className='product-img' alt='vino' src={`${apiUrl.replace('/api','')}/uploads/${this.props.data.image}`}></img>
        <div className='name-and-info'>
        <h4>{this.props.data.name}</h4>
        <div>{this.props.data.info}</div>
        </div>
        <div className='price'>{this.props.data.priceWithTax.toFixed(2)+'€'}</div>
        <div className='add-to-cart' onClick={()=>this.props.addToOrder(this.props.data._id)}><ion-icon className='add-icon' name="add-circle-outline"></ion-icon></div>
      </div>
    )
  }
}

class SummaryProduct extends React.Component{
  render(){
    return(
      <div className='product-cont'>
        <h4>{this.props.data.name}</h4>
        <div className='price'>{(this.props.data.priceWithTax * this.props.data.count).toFixed(2)+'€'}</div>
        <div className='set-quant'>{this.props.data.count}</div>
          <div className='arrows'>
            <div className='arrow-up' onClick={()=>this.props.setCountOfProduct(this.props.data._id,this.props.data.count+1)}><ion-icon name="arrow-up-outline"></ion-icon></div>
            <div className='arrow-down' onClick={()=>this.props.setCountOfProduct(this.props.data._id,this.props.data.count-1)}><ion-icon name="arrow-down-outline"></ion-icon></div>
          </div>
      </div>
    )
  }
}

class ProductFilters extends React.Component{
  render(){
    const filters = [{
      filterName: 'all',
      heading:'Všetko'
    },{
      filterName: 'white',
      heading:'Biele'
    },{
      filterName: 'red',
      heading:'Červené'
    },{
      filterName: 'rose',
      heading:'Ružové'
    }]
    const toRender = filters.map(filter => {return(<FilterItem filterProducts={this.props.filterProducts} active={this.props.active} filterName={filter.filterName} heading={filter.heading}></FilterItem>)})
    return(

      <div className='filters'>
        {toRender}
      </div>
    )
  }
}

class FilterItem extends React.Component{
  render(){
    return(
      <div style={this.props.active===this.props.filterName ? {backgroundColor:'black',color:'white'}:{}} onClick={()=>this.props.filterProducts(this.props.filterName)}>{this.props.heading}</div>
    )
  }
}

class ContactForm extends React.Component{
  constructor(props){
    super()
    this.state = {times:[],selectedCity:''}
    this.handleCityChange = this.handleCityChange.bind(this)
  }
  async componentDidMount(){
    const times = await axios.get(apiUrl+'/times')
    this.setState({times : times.data.times})
    if (times.data.times.length > 1){
      this.setState({selectedCity:times.data.times[0].city})
      this.props.handleInputChange('city',times.data.times[0].city)
      this.props.handleInputChange('deliveryDate',times.data.times[0].dates.length !==0 && times.data.times[0].dates[0])
    }
    console.log(times.data.times)
  }
  
  handleCityChange(city){
    this.setState({selectedCity:city})
  }

  render(){
    const options = this.state.times.map(time => {return (<option>{time.city}</option>)})
    const selectedCity = this.state.times.find(x => x.city == this.state.selectedCity)
    const datesToRender = selectedCity && selectedCity.dates.length > 0 ? <select onClick={(event) => this.props.handleInputChange('deliveryDate',event.target.value)}>{selectedCity.dates.map(date => <option>{date}</option>)}</select>: <div>Žiadne termíny</div>
    return(
      <div className='contactForm'>
        <h2 style={{marginTop:'40px'}}>Kontaktné údaje</h2>
        <div className='contactInfo'>
        <div className='contactInput'>
          <div className='label'>Meno</div>
          <input onChange={(event) => this.props.handleInputChange('name',event.target.value)}></input>
        </div>
        <div className='contactInput'>
          <div className='label'>Priezvisko</div>
          <input onChange={(event) => this.props.handleInputChange('surname',event.target.value)}></input>
        </div>
        <div className='contactInput'>
          <div className='label'>Email</div>
          <input onChange={(event) => this.props.handleInputChange('email',event.target.value)}></input>
        </div>
        <div className='contactInput'>
          <div className='label'>Telefón</div>
          <input onChange={(event) => this.props.handleInputChange('phone',event.target.value)}></input>
        </div>
        </div>
        <h2 style={{marginTop:'40px'}}>Dodacie údaje</h2>
        <div className='contactInfo'>
        <div className='contactInput'>
          <div className='label'>Názov ulice a popisné č.</div>
          <input onChange={(event) => this.props.handleInputChange('address',event.target.value)}></input>
        </div>
        <div className='contactInput'>
          <div className='label'>Mesto</div>
          <select onClick={(event) => {
            this.props.handleInputChange('city',event.target.value)
            this.handleCityChange(event.target.value)
        }}>
            {options}
          </select>
        </div>
        <div className='contactInput'>
          <div className='label'>Termín dodania</div>
          {datesToRender}
        </div>
        </div>
        <div className='gdpr'>
        <div>Súhlasím so spracovaním osobných údajov</div>
        <input type='checkbox' onChange={(event) => this.props.handleInputChange('gdpr',event.target.checked)}></input>
        </div>
      </div>
    )
  }
}

class Loader extends React.Component{
  render(){
    return(
      <div className='overlay'>
      <div className='loader'>
        {this.props.isLoading ? 
        <img src={spinner} alt='spinner'></img>
        :
        <div>
          <div className='loaderMessage'>{this.props.message}</div>
          <div className='orderButton' onClick={()=>{
            this.props.closeMessage()
            if (this.props.afterExited){
              this.props.afterExited()
            }
            }}>Zavrieť</div>
        </div>
        
      }
      </div>
      </div>
    )
  }
}


export default App;
