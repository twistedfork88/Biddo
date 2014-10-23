/** @jsx React.DOM */

/** MIXINS */

/** WebSocket mixin */
var WebSocketMixin = {
    ws: null,
    isConnected: false,
    isWebSocketSupported: false,
    onMessageCallback: null,
    componentDidMount: function(){
        this.checkWebSocketSupport();
    },
    checkWebSocketSupport: function(){
        if("WebSocket" in window){
            this.isWebSocketSupported = true;
        }
    },
    createConnection: function(config){
        if(this.isWebSocketSupported){
            this.ws = new WebSocket(config.url);
            this.ws.onopen = this.onConnect;
            this.ws.onmessage = this.onMessage;
            this.ws.onerror = this.onError;
            this.onMessageCallback = config.onMessageCallback;
        }
        else alert("Your browser doesn't support websockets. Kindly upgrade to IE10 or use Chrome/Firefox");
    },
    onConnect: function(){
        console.log('websocket connection established');
        this.isConnected = true;
    },
    onMessage: function(evt){
        console.log('received message from server');
        var message = JSON.parse(evt.data);
        console.log(message);
        
        //pass on the message to the registered callback
        this.onMessageCallback.call(null, message);
    },
    onError: function(err){
        console.log('WebSocket error: '+err);
    },
    sendMessage: function(message){
        if(this.isConnected)
            this.ws.send(message);
        else alert('ERROR:: WebSocket connection not establised.');
    }
}

/** XHR request mixin */
var AjaxMixin = {
    configuration: null,
    makeXHR: function(configuration){
        this.configuration = configuration;
        var self = this;
        $.ajax({
            url: configuration.url,
            data: configuration.data,
            type: configuration.type
        })
        .done(function(response){
            self.configuration.callback.call(null, response);
        });
    }
}

/** COMPONENTS */

/*
 * Top bar component
 */
var TopBarComponent = React.createClass({
    render: function(){
        return (
            <div className='topBar'></div>
        );
    }
});

/*
 * Footer component
 */
var FooterComponent = React.createClass({
	getInitialState: function(){

		return {
			'config': {}
		}

	},
    render: function(){
        return (
            <div className='footer'>
            	&copy;copyright BIDDO, SAP Labs
            </div>
        );
    },
    componentDidMount: function(){
    	var DOMNode = this.getDOMNode();
    	this.state.config.DOMNode = DOMNode;

    	setTimeout(function(){

    		$(DOMNode).css({'display': 'block'});

    	}, 1000);
    }   
});

var NavBarComponent = React.createClass({
    componentDidMount: function(){
        var DOM = this.getDOMNode();
        $(DOM).find('li a').click(function(){
            var href = $(this).attr('href');
            window.location.href = href;
        });
    },
    render: function(){
        
        var lis = this.props.items.map(function(item){
            return <li className={item.class}><a href={item.href} data-toggle='tab'>{item.name}</a></li>;
        });
        
        return(
            <ul className="navbar" style={{"margin-bottom": "5px;"}}>
                {lis}
            </ul>
        );
    }
});

/**
 * Carousel component
 */
var CarouselComponent = React.createClass({
    componentDidMount: function(){
        var DOM = this.getDOMNode();
        $(DOM).find('.eachcarousel:nth-child(n+2)').hide();
        var pics = $(DOM).find('.eachcarousel');
        var curr = 1;
        var next = 2;
        
        var currdom = $(DOM).find('.eachcarousel:nth-child('+curr+')');
        setInterval(function(){
            if(next > pics.length){
                next = 1;
            }
            if(curr > pics.length)curr = 1;
            
            var nextdom = $(DOM).find('.eachcarousel:nth-child('+next+')');
            
            $(DOM).find('.eachcarousel:nth-child('+next+')').fadeIn(1600);
            $(DOM).find('.eachcarousel:nth-child('+curr+')').fadeOut(1000);
            
            next++;
            curr++;
            
        }, 8000);
        
    },
    render: function(){
        return(
        <div className='carousel'>
            <div className='eachcarousel'>
                <img src='http://cdn.thegadgetflow.com/wp-content/uploads/2014/09/cogito-pop-gadget-flow1.jpeg'/> 
           </div>
            <div className='eachcarousel'>
                <img src='http://cdn.thegadgetflow.com/wp-content/uploads/2014/09/Travel-Gadgets.jpg'/>    
                <div className='content'>
                    <p className='heading'>sap biddo</p>
                    <small className='text'>welcome to the SAP annual bidding/shopping experience</small>
                    <br/>
                    <img src='http://www.clipartbest.com/cliparts/zxi/gk6/zxigk6pcA.png' width='50px' />
                </div>
            </div>
            <div className='eachcarousel'>
                <img src='http://cdn.thegadgetflow.com/wp-content/uploads/2014/10/the-gadget-flow-cool-gadgets.jpg'/> 
                <div className='content'>
                    <p className='heading'>enter the giveaway</p>
                    <small className='text'>bid or shop for exquisite items and be a proud owner</small>
                    <br/>
                    <img src='http://www.clipartbest.com/cliparts/zxi/gk6/zxigk6pcA.png' width='50px' />
                </div>
            </div>
            <div className='eachcarousel'>
                <img src='http://cdn.thegadgetflow.com/wp-content/uploads/2014/09/slider11.jpg'/> 
                <div className='content'>
                    <p className='heading'>meet your inevitable must haves</p>
                    <small className='text'>simple, emotional and iconic</small>
                    <br/>
                </div>
            </div>
            <div className='topdivcarousel'>
                BIDDO
            </div>
        </div>
        );
    }
});

/**
 * MainContent component
 */
var MainContentComponent = React.createClass({
    render: function(){
        return(
            <div className='mainContent'>
                <div className='operations'>
                    <Categories />
                </div>
                <div className='mainheading'>about biddo</div>
                <br/>
                <div className='maintext'>
                    Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of 'de Finibus Bonorum et Malorum' (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, 'Lorem ipsum dolor sit amet..', comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from 'de Finibus Bonorum et Malorum' by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.    
                </div>
                <br/>
                <div className='split'>
                    <table width='100%'>
                        <tr valign='top'>
                            <td width='40%'>
                                <div className='video'>
                                    <VideoPlayer videoSrc={ "./files/videos/sample.mp4" } vidWidth={ '100%' } vidFloat={ "none" } /> 
                                    <div className='viddesc'>
                                        <h2>What SAP Biddo is all about?</h2>
                                        <div className='maintext'>
                                            It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text.    <br/>
                                            <a href="javascript:void(0)" className="btn btn-flat btn-success withripple">read more<div className="ripple-wrapper"></div></a>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2>Where else could it be ?</h2>
                                    <div className='mapdiv'>
                                        <MapComponent />
                                        <p style={ { marginTop:'10px' } }>
                                            <img src='./files/images/marker.png' width='20px' />&nbsp;SAP Labs, Bengaluru
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td style={ { paddingLeft:'10px' } }>
                                <div className='mainheading'>2013 topsellers</div><br/>
                                <CollageComponent /><br/>
                                <div className='details'>
                                    <div className='mainheading'>we accomplished</div><br/>
                                    <div className='detail'>
                                        <span className='num'>4,00,000 INR</span> from SAP Shopping 2013
                                    </div>
                                    <div className='detail'>
                                        <span className='num'>7,00,000 INR</span> from SAP Biddo 2013
                                    </div>
                                    <div className='detail'>
                                        <span className='num'>1,00,000 INR</span> from SAP Tambola 2013
                                    </div>
                                </div>
                                
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        );
    }
});
        
        
var MapComponent = React.createClass({
        render: function(){
            return(
                <div id="map" style={ { width:'100%', height:'200px' }}></div>
            );
        },
        componentDidMount: function(){
            var mycenter = new google.maps.LatLng(12.977788400000000000,77.714421399999990000);
            var mapProp = {
              center:mycenter,
              zoom:14,
              mapTypeId:google.maps.MapTypeId.ROADMAP,
              styles:[{"stylers":[{"saturation":-100},{"gamma":1}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"water","stylers":[{"visibility":"on"},{"saturation":50},{"gamma":0},{"hue":"#50a5d1"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#333333"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"weight":0.5},{"color":"#333333"}]},{"featureType":"transit.station","elementType":"labels.icon","stylers":[{"gamma":1},{"saturation":50}]}]    
            };
            var marker=new google.maps.Marker({
              position:mycenter,
            
            });
            
            var map=new google.maps.Map(document.getElementById("map"),mapProp);
            marker.setMap(map);
        }
});
    
var CollageComponent = React.createClass({
    render: function(){
        return(
            <div className="Collage effect-parent">
                <img src="./files/images/Cricket.jpg" />
                <img src="./files/images/book.JPG" />    
                <img src="./files/images/wallet.jpg" />                
                <img src="./files/images/jersey.jpg" width='30%' />
                <img src="./files/images/camera.jpg" />
            </div>
        );
    },
    componentDidMount: function(){
        $('.Collage').collagePlus({
            'targetHeight' : 100,
            'effect' : "effect-2"
        });
        
        if(navigator.userAgent.indexOf('Firefox') > -1)
            $('.Collage img').css('transform', 'translateY(0)').css('opacity', 1);
    }
});

/**
 * Categories component
*/
var Categories = React.createClass({
    componentDidMount: function(){
        var catDOM = $(this.getDOMNode()).find('.category');
        var catWidth = $(catDOM).width();
        $(catDOM).height(catWidth*0.5);
    
        $(catDOM).find('.topdiv').height(catWidth*0.5);
        $(catDOM).find('.bottomdiv').height(catWidth*0.5);
        
        var boxHeight = $(catDOM).find('.topdiv').height();
        
        var count = 0;
        var interval = setInterval(function(){
            
            if(count === catDOM.length){
                clearInterval(interval);
                return;
            }
            
            $(catDOM[count++]).animate({
                opacity:1,
                marginTop:0
            }, 150);
        }, 400);
        
        var flag = -1;
        var factor1 = 0.5;
        setInterval(function(){
            $(catDOM[0]).find('.box').animate({
                'margin-top':flag*boxHeight*factor1
            }, 700, 'easeOutCubic');
        
            factor1+=0.5;
            if(factor1 === 1.5){
                flag = 1;
                factor1 = 0;
            }
            else if(factor1 === 0.5)flag = -1;
            
        }, 6700);
        
        var flag2 = -1;
        var factor2 = 0.5;
        setInterval(function(){
            $(catDOM[1]).find('.box').animate({
                'margin-top':flag2*boxHeight*factor2
            }, 700, 'easeOutCubic');
        
            factor2+=0.5;
            if(factor2 === 1.5){
                flag2 = 1;
                factor2 = 0;
            }
            else if(factor2 === 0.5)flag2 = -1;
            
        }, 8300);
        
       var flag3 = -1;
        var factor3 = 0.5;
        setInterval(function(){
            $(catDOM[2]).find('.box').animate({
                'margin-top':flag3*boxHeight*factor3
            }, 700, 'easeOutCubic');
        
            factor3+=0.5;
            if(factor3 === 1.5){
                flag3 = 1;
                factor3 = 0;
            }
            else if(factor3 === 0.5)flag3 = -1;
            
        }, 9500);
    },
    render: function(){
        return(
            <div className='categories'>
                <div className='backbar'></div>
                <div style={ { margin:'auto', width:'97%' } } className='categorieslist'>
                    <table width='100%'>
                        <tr>
                            <td width='33%'>
                                <div className='category'>
                                    <div className='box'>
                                        <div className='topdiv' style={ { background: 'url(http://inplaceauction.com/uploads/main_slider/12/9a1a8435984a51ad356bfed0b4095268.jpg)' } }>
                                            <img src='http://www.clipartbest.com/cliparts/zxi/gk6/zxigk6pcA.png' width='30px' style={ { marginTop: '1rem', marginLeft:'1rem' } }/>
                                            <p>bid</p>
                                        </div>
                                        <div className='bottomdiv'>
                                            experience the annual gala bidding event. a set of exquisite items to grab.... the message began to resonate. It is no longer about just a shoe or a pair of shorts; it is about a state of mind. 
                                            <p>BID</p>                  
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td width='33%'>
                                <div className='category'>
                                    <a href='/shop'>
                                        <div className='box'>
                                            <div className='topdiv' style={ { background: "url(http://news.bbcimg.co.uk/media/images/66388000/jpg/_66388863_groupgetty.jpg)" }}>
                                                <img src='http://www.clipartbest.com/cliparts/zxi/gk6/zxigk6pcA.png' width='30px' style={ { marginTop: '1rem', marginLeft:'1rem' } } />
                                                <p>shop</p>
                                            </div>
                                            <div className='bottomdiv'>
                                                experience the annual gala bidding event. a set of exquisite items to grab.... the message began to resonate. It is no longer about just a shoe or a pair of shorts; it is about a state of mind. 
                                                <p>SHOP</p> 
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </td>
                            <td width='33%'>
                                <div className='category'>
                                    <a href='/profile'>
                                        <div className='box'>
                                            <div className='topdiv' style={ { background: 'url(http://4.bp.blogspot.com/-ci8zjNrp50I/U_yCxyehuzI/AAAAAAAADX4/uiAIDRcpUB4/s1600/ahagzjsozh.jpg)' }}>
                                                <img src='http://www.clipartbest.com/cliparts/zxi/gk6/zxigk6pcA.png' width='30px' style={ { marginTop: '1rem', marginLeft:'1rem' } }/>
                                                <p>lionel messi</p>
                                            </div>
                                            <div className='bottomdiv'>
                                                your profile details. shows your bidding and purchasing history at SAP Biddo.
                                                <p>PROFILE</p> 
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
                <br/>
            </div>
        );
    }
});

var Shop = React.createClass({
    render: function(){
        var navs = [{
            class:'',
            href: 'http://localhost:3000/index',
            name: 'Home'
        },{
            class:'active',
            href: 'http://localhost:3000/shop',
            name: 'Shop'
        },{
            class:'',
            href: 'http://localhost:3000/bid',
            name: 'Bid'
        },{
            class:'',
            href: 'http://localhost:3000/profile',
            name: 'Profile'
        }];
        return(
            <div className='shop'>
                <h1 className='bigheading'>SHOP</h1>
                <div className='hidediv'></div><br/>
                <NavBarComponent items={navs} style={{marginTop:'20rem'}} />
                <h1>CHOOSE ITEMS</h1>
                <div style={ { height:'8px' } }></div>
                <ItemsListComponent items={ this.props.items} />
            </div>
        );
    }
});

/** 
 *Items list component
 */
var ItemsListComponent = React.createClass({
    msnry: null,
    componentDidMount: function(){
        var container = this.getDOMNode();
        this.msnry = new Masonry( container, {
          "itemSelector": '.shopitem',
          "gutter":8
        });
        
        this.msnry.layout();
        this.msnry.on('layoutComplete', function(msnryInstance, laidOutItems){
            var items = $('.shopitem');
            var count = 0;
            var interval = setInterval(function(){
                console.log(count);
                if(count === items.length){
                    clearInterval(interval);
                    return;
                }
                $(items[count++]).animate({
                    opacity:1
                }, 350);
            }, 100);
            
        });
        
    },
    render: function(){
        var items = this.props.items.map(function(item){
            return <ItemComponent itemid={item.itemId} image={item.itemImage} class={item.itemClass} name={item.itemName} desc={item.itemDesc} price={item.itemPrice} isShopped={item.isShopped} count={item.itemCountRemaining} />;
        });
        return(
            <div className='shopitemslist'>
                <div className='items'>
                    {items}
                </div>
            </div>
        );
    }
});

/** 
 *Item component
 */
var ItemComponent = React.createClass({
   mixins:[AjaxMixin],
   DOMNode: null,    
   mouseEnter: function(evt){
        var DOM = this.getDOMNode();
        var x = evt.pageX - $(DOM).offset().left;
        var y = evt.pageY - $(DOM).offset().top;
            var itemdesc = $(DOM).find('.itemdesc');
            if(x < 30){    
                    $(itemdesc).css('left', '-500px').css('top', '0px')
                    $(itemdesc).css('opacity', 1);
                    $(itemdesc).animate({
                        'left': 0
                    }, 200);
            }
            else if(Math.abs(x - $(DOM).width()) < 30){
                $(itemdesc).css('left', '500px').css('top', '0px')
                $(itemdesc).css('opacity', 1);
                $(itemdesc).animate({
                        'left': 0
                    }, 200);
            }
            else if(y < 30){
                $(DOM).find('.itemdesc')
                    .css('top', -500).css('left', '0px').css('opacity', 1)
                    .animate({
                        'top': 0
                    }, 200);        
            }
            else if(Math.abs(y - $(DOM).height()) < 30){
                $(DOM).find('.itemdesc')
                    .css('top', 500)
                    .css('left', '0px')
                    .animate({
                        'top': 0
                    }, 200);   
            }
   },    
   mouseLeave: function(evt){
        var DOM = this.getDOMNode();
        var x = evt.pageX - $(DOM).offset().left;
        var y = evt.pageY - $(DOM).offset().top;
        var itemdesc = $(DOM).find('.itemdesc');
        if(x < 30){    
                $(itemdesc).animate({
                    'left': -900
                }, 200);
        }
        else if(Math.abs(x - $(DOM).width()) < 30){
            $(itemdesc).animate({
                    'left': 900
                }, 200);
        }
        else if(y < 30){
            $(DOM).find('.itemdesc')
                .animate({
                    'top': -500
                }, 200);        
        }
        else if(Math.abs(y - $(DOM).height()) < 30){
            $(DOM).find('.itemdesc')
                .animate({
                    'top': 500
                }, 200);   
        }
   },    
   componentDidMount: function(){
       var DOM = this.getDOMNode();       
       var that = this;
       $(DOM).find('.blur').height($(DOM).height());
       $(DOM).find('.itemdesc').height($(DOM).find('.top').height() - 10);
       
       /** small hack for IE10 :: layoutComplete event not firing for IE10, 
         * so we show the items right away 
         */
       var userAgent = navigator.userAgent;
       if(userAgent.indexOf("MSIE 10.0") > -1){
           $(DOM).css('opacity', 1);
       }
       
       $(DOM).on('mouseenter', that.mouseEnter);
       $(DOM).on('mouseleave', that.mouseLeave);
       
       var btn = $(DOM).find('.btn');
       
       var btnText = StandardText.purchase;
       if(this.props.count <= 0)btnText = StandardText.soldout;
       else if(this.props.isShopped)btnText = StandardText.purchased;
       
       $(btn).text(btnText);
       
       /** render modal for purchase */
       $(btn).click(function(){           
           var title = $(DOM).find('.itemname').text();
           var price = $(DOM).find('.itemprice').text();
           var img = $(DOM).find('.top').css('background-image').split('(')[1];
           img = img.split(')')[0];
           
           var body = "<table><tr valign='top'><td><img src="+img+" width='100%' style='box-shadow:0px 0px 6px 2px rgba(0,0,0,0.4)' /></td><td style='padding-left:0.8rem'>You wished to purchase item <b>"+title+"</b> worth <b>"+price+"</b>. Are you sure?</td></tr></table>";
           
           React.unmountComponentAtNode(document.getElementById('modal'));
           React.renderComponent(<ModalComponent title={StandardText.modalpurchasetitle} body={body} caller={that.purchaseProduct} btnText={'PURCHASE'} />, document.getElementById('modal'));
       });
   },   
   processPostPurchase: function(response){
        response = JSON.parse(response);
        if(response.statusCode === 200){
            $(this.getDOMNode()).find('.btn').addClass('disabled');
            React.renderComponent(<AlertComponent class={"alert alert-success"} message={StandardText.itempurchasesuccess} />, document.getElementById('alertBox'));

        }
        else{
            React.renderComponent(<AlertComponent class={"alert alert-danger"} message={StandardText.itempurchasefailure} />, document.getElementById('alertBox'));                          
        }
   },
   purchaseProduct: function(){
        var itemid = $(this.getDOMNode()).data('itemid');
        var config = {
            url: 'http://localhost:3000/purchase',
            type: 'POST',
            data:{
                userId: 'I068574',
                itemId: itemid
            },
            callback: this.processPostPurchase
        };
        this.makeXHR(config);      
   },        
   render: function(){
        var img = this.props.image;
        var buybtnclass = (this.props.isShopped)?"btn btn-flat btn-primary withripple disabled":"btn btn-flat btn-primary withripple";
        
        
        return(
            <div className={this.props.class} data-itemid={this.props.itemid}>
                <div className='blur'></div>
                <div className='itemdesc'>
                    <p>{this.props.desc}</p>
                    <p>
                        <label>product popularity</label>
                        <div className="progress">
                            <div className="progress-bar progress-bar-success" style={ {"width": "40%"} }></div>
                        </div>
                    </p>
                    <p>
                       #purchases 10
                    </p>
                </div>    
                <div className='top' style={ { background: 'url('+img+')' } }></div>
                <div className='bottom'>
                    <table width='100%'>
                        <tr valign='top'>
                            <td>
                                <p className='itemname'>{this.props.name}</p>
                                <p className='itemprice'>{this.props.price} INR</p>
                            </td>
                            <td style={ { textAlign:'right' } }>
                                <a href="javascript:void(0)" className={buybtnclass}>
                                    purchase
                                    <div className="ripple-wrapper"></div>
                                </a>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        );
   }    
});

/**
 * Modal component
 */
var ModalComponent = React.createClass({
    getInitialState: function() {
      return {
        className: 'modal fade'
      };
    },
    show: function() {
      var DOM = this.getDOMNode();
      var title = this.props.title;
      var body = this.props.body;
    
      this.setState({ className: 'modal fade show' });
      
      /** set the title and body of the modal and show it */
      setTimeout(function() {
          
        $(DOM).find('.modal-title').html(title);
        $(DOM).find('.modal-body').html(body);
          
        this.setState({ className: 'modal fade show in' });
      }.bind(this), 0);
    },
    hide: function() {
      this.setState({ className: 'modal fade show' });
      setTimeout(function() {
        this.setState({ className: 'modal fade' });
          
      }.bind(this), 400);
    },
    componentDidMount: function(){
        this.show();
    },
    process: function(){
        var DOM = this.getDOMNode();
        $(DOM).find('.btn.btn-success').addClass('disabled');
        this.props.caller.call(this);
    },
    render: function(){
        return(
            <div className={this.state.className}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h4 className="modal-title"></h4>
                        </div>
                        <div className="modal-body">
                            <p></p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.hide}>Close</button>
                            <button type="button" className="btn btn-success" onClick={this.process}>{this.props.btnText}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

/**
 * Alert component
 */
var AlertComponent = React.createClass({
    componentDidMount: function(){
        var DOM = this.getDOMNode();
        $(DOM).parent().animate({
            bottom: '0px'
        }, 500, function(){
            setTimeout(function(){
                $(DOM).parent().animate({
                    bottom: '-90px'
                }, 500, function(){
                    React.unmountComponentAtNode(document.getElementById('alertBox'));
                });
            
            }, 3000)
        })
    },
    render: function(){
        return(
            <div className={this.props.class}>
                <p>{this.props.message}</p>
            </div>
        );
    }
});
           
var ProfileComponent = React.createClass({
    render: function(){
        
        var navs = [{
            class:'',
            href: 'http://localhost:3000/index',
            name: 'Home'
        },{
            class:'',
            href: 'http://localhost:3000/shop',
            name: 'Shop'
        },{
            class:'',
            href: 'http://localhost:3000/bid',
            name: 'Bid'
        },{
            class:'active',
            href: 'http://localhost:3000/profile',
            name: 'Profile'
        }];
        
        return(
            <div className='profile'>
                <h1 className='bigheading'>PROFILE</h1>
                <div className='hidediv'></div>
                <br/>
                <NavBarComponent items={ navs } />
                <AvatarComponent /><br/><br/>
                <ListComponent title={"your shopping list"} url={'http://localhost:3000/getitemdetails'} itemids={this.props.shopitemids} btntext={'UN-PURCHASE'} /><br/><br/>
                <ListComponent title={"your bidding list"} url={'http://localhost:3000/getitemdetails'} itemids={[]} />
            </div>
        );
    }
});
           
/** Avatar component */
var AvatarComponent = React.createClass({
    render: function(){
        return(
            <div className='avatar'>
                <table>
                    <tr valign='top'>
                        <td width='40%' style={ { textAlign: 'center' } }>
                            <div className='profileimg'>
                                <img src='./files/images/img2.jpg' width='100%' />
                            </div>
                        </td>
                        <td style={ { textAlign: 'left' } }>
                            <p className='profilename'>lionel Andrés messi</p>
                            <p className='profileid'>I068574</p>
                            <hr/>
                        </td>
                    </tr>
                </table>
            </div>
        );
    }
});
               
var ListComponent = React.createClass({
    mixins:[AjaxMixin],
    getInitialState: function(){
        return {
            items: []
        }
    },
    componentDidMount: function(){
        var url = this.props.url;
        var itemids = this.props.itemids;
        if(itemids && itemids.length){
            
            var config = {
                url: url,
                data:{
                    item:itemids
                },
                callback: this.postRetrieveItemDetails
            }
            this.makeXHR(config);
        }
    },
    postRetrieveItemDetails: function(response){
        var self = this;
        response = JSON.parse(response);
        if(response.statusCode === 200){
            var itemData = response.message;
            var items = itemData.map(function(item){
                return <ListItemComponent item={item} btntext={self.props.btntext} />;
            });
            self.setState({
                items: items
            });
        }
        else alert("ERROR:: Unable to fetch your shopping list!");
    },
    render: function(){
        var currItems = this.state.items;
        return(
            <div className='shoppinglist'>
                <div className="panel panel-success">
                    <div className="panel-heading">
                        <h3 className="panel-title">{this.props.title}</h3>
                    </div>
                    <div className="panel-body">
                        {currItems}
                    </div>
                </div>
            </div>
        );
    }
});
           
var ListItemComponent = React.createClass({
    mixins:[AjaxMixin],
    itemType: null,
    DOM: null,
    render: function(){
        return(
            <div className='item'>
                <table width='100%'>
                    <tr valign='top'>
                        <td width='30%'>
                            <img className='listitemimg' src={this.props.item.itemImage} width='100%' />
                        </td>
                        <td valign='top' style={ { padding:'1rem' } }>
                            <p className='listitemid' style={ { display:'none' } }>{this.props.item.itemId}</p>
                            <h3 className='listitemname'>{this.props.item.itemName}</h3>
                            <p className='listitemdesc'>{this.props.item.itemDesc}</p>
                            <p>
                                <button type="button" className="btn btn-success" onClick={this.processClick}>{this.props.btntext}</button>
                            </p>
                        </td>
                    </tr>
                </table>
                <br/>
            </div>
        );
    },
    processClick: function(evt){
        var itemimg = $(this.DOM).find('.listitemimg').attr('src');
        var itemname = $(this.DOM).find('.listitemname').text();
        
        //check if the type of the item is purchase or bid
        var type = $(evt.target).parent().text();
        
        if(type === ButtonText.undoPurchase){            
            this.itemType = 'shop';
        
            var title = StandardText.modalUndoPurchaseTitle;
            var body = "You wished to undo your purchase of item <b>"+itemname+"</b>. Are you sure you want to proceed?";
            
            React.unmountComponentAtNode(document.getElementById('modal'));
            React.renderComponent(<ModalComponent title={title} body={body} caller={this.postProcessClick} btnText={ButtonText.undoPurchase} />, document.getElementById('modal'));
        }
    },
    postUndoProcess: function(response){
        response = JSON.parse(response);
        console.log(response);
        React.unmountComponentAtNode(document.getElementById('alertBox'));
        if(response.statusCode === 200){
            React.renderComponent(<AlertComponent class={"alert alert-success"} message={StandardText.itemundopurchasesuccess} />, document.getElementById('alertBox'));
                             
            //remove item from the DOM
            $(this.DOM).remove();                     
                                  
        }
        else{
            React.renderComponent(<AlertComponent class={"alert alert-danger"} message={StandardText.itemundopurchasefailure} />, document.getElementById('alertBox'));                        
        }
    },
    postProcessClick: function(){
         if(this.itemType === 'shop'){
             
            //get the item id
            var item = $(this.DOM).find('.listitemid')[0];
            item = $(item).text();
             
            var config = {
                url: 'http://localhost:3000/unpurchase',
                type: 'POST',
                data:{
                    userId: 'I068574',
                    itemId: item
                },
                callback: this.postUndoProcess
            }
            this.makeXHR(config);
        }
    },
    componentDidMount: function(){
        this.DOM = this.getDOMNode();
    }
});
                
var BannerComponent = React.createClass({
    render: function(){
        return(
            <div className='avatar'>
                <h1>{this.props.bannerText}</h1>
            </div>
        );
    }
});
           
/** Custom <video> player */
var VideoPlayer = React.createClass({
    vidElem: null,
    vidDuration: 1,
    vidDurationText: 0,
    isPaused: true,
    isMuted: false,
    isMediaLoaded: false,
    vidUpdateInterval: null,
    trackLength: 0,
    componentDidMount: function(){
        var DOM = this.getDOMNode();
        this.vidElem = $(DOM).find('video')[0];
        $(this.vidElem).height((9*$(this.vidElem).width())/16);
        this.trackLength = $(DOM).find('.vidTrack').width();
        console.log(">> vidTrack is"+this.trackLength);
        
        var that = this;
        
        /** wait for the media to get ready and then compute its duration */
        var i = setInterval(function(){
            if(that.vidElem.readyState >0){
                that.isMediaLoaded = true;
                that.vidDuration = (that.vidElem.duration > 0)? that.vidElem.duration : 1;
                that.vidDurationText = that.convertToTime(that.vidDuration);
                console.log(">> duration is "+that.vidDuration);
                
                clearInterval(i);
            }
        }, 500);
        
        this.hideShowControlsPanel();
       
    },
    hideShowControlsPanel: function(){
        var DOM = this.getDOMNode();
        /** fadeout/fadein controls */
        $(DOM).find('.controls').fadeOut();
        $(DOM)
        .mouseenter(function(){
            $(DOM).find('.controls').fadeIn();
        })
        .mouseleave(function(){
             $(DOM).find('.controls').hide();
        });
    },
    playpause: function(){
        this.isPaused = this.vidElem.paused;
        var DOM = this.getDOMNode();
        if(this.isPaused){
            $(DOM).find('.playpause').attr('src', '/files/images/pause.png');
            this.vidElem.play();
            this.updateProgressBar();
        }else{
            $(DOM).find('.playpause').attr('src', '/files/images/play.png');
            this.vidElem.pause();
            clearInterval(this.vidUpdateInterval);
        }        
    },
    volumecontrol: function(){
         var DOM = this.getDOMNode();
        if(this.isMuted){
            $(DOM).find('.volume').attr('src', '/files/images/volume.png');
            $(this.vidElem).prop('muted', false);
            this.isMuted = false;
        }else{
            $(DOM).find('.volume').attr('src', '/files/images/mute.png');
            $(this.vidElem).prop('muted', true);
            this.isMuted = true;
        }        
    
    },
    updateProgressBar: function(){
        var that = this;
         var DOM = this.getDOMNode();
        this.vidUpdateInterval = setInterval(function(){
            if(!that.vidElem.ended){
                //console.log(that.vidElem.currentTime+" "+that.vidDuration);
                var ratio = that.vidElem.currentTime*100/that.vidDuration;
                //console.log(">> ratio is "+ratio);
                $(DOM).find('.vidTrackFill').width(ratio+"%");
                
                //update .time element
                var passedTime = that.convertToTime(that.vidElem.currentTime);
                //console.log("passedTime is "+passedTime);
                
                $(DOM).find('.time').text(passedTime+'/'+that.vidDurationText); 
            }
            else{
                $(DOM).find('.vidTrackFill').width("100%");
                $(DOM).find('.time').text(that.vidDurationText+'/'+that.vidDurationText); 
                clearInterval(that.vidUpdateInterval);
            }
        }, 1000);
        
    },
    updateProgressBarClick: function(evt){
        /** defer processing till the readyState has changed */
        if(!this.isMediaLoaded){
            alert("INFO:: Please wait... loading media...");
            return;
        }   
        
        var DOM = this.getDOMNode();
        var posX = evt.pageX - $(DOM).find('.vidTrack').offset().left;
        
        if(this.trackLength === 100)
           this.trackLength =$(DOM).find('.vidTrack').width();
        
        console.log(">> posX is "+posX);
        var newTime = (posX*this.vidDuration)/this.trackLength;
        console.log(">> newTime is "+newTime);
        this.vidElem.currentTime = newTime;
        var progress = (newTime*100)/this.vidDuration;
        $(DOM).find('.vidTrackFill').width(progress+"%");
        
        var passedTime = this.convertToTime(this.vidElem.currentTime);
        $(DOM).find('.time').text(passedTime+'/'+this.vidDurationText); 
    },
    fullscreen: function(){
        if (this.vidElem.requestFullscreen) {
          this.vidElem.requestFullscreen();
        } else if (this.vidElem.mozRequestFullScreen) {
          this.vidElem.mozRequestFullScreen();
        } else if (this.vidElem.webkitRequestFullscreen) {
          this.vidElem.webkitRequestFullscreen();
        }
    },
    convertToTime: function(time){
        var time = Math.floor(time);
        console.log(">> time is "+time);
        var  min = parseInt(time/60);
        var sec = parseInt(time - min*60); 
        if(min<10) min = '0'+min;       
        if(sec < 10) sec = '0'+sec;
        console.log(min+":"+sec);
        return min+":"+sec;
    },    
    render: function(){
        return (
            <div className='customVideo' style={ { 'width': this.props.vidWidth, 'float': this.props.vidFloat } }>
                <video width='100%' poster='./files/images/transparent.png' onClick={ this.playpause }>
                    <source src={ this.props.videoSrc } type='video/mp4' />
                </video>
                <div className='controls'>
                    <table width='100%'>
                        <tr valign='middle'>
                            <td width='40px'>
                                <img className='playpause' src='./files/images/play.png' width='70%' onClick={ this.playpause } />
                            </td>
                            <td>
                                <div className='vidTrack' onClick={ this.updateProgressBarClick }>
                                    <div className='vidTrackFill'></div>
                                </div>
                            </td>
                            <td width='100px'>
                                <span className='time'>00:00/00:00</span>
                            </td>
                            <td width='40px'>
                                <img className='volume' src='./files/images/volume.png' width='70%' onClick={ this.volumecontrol } />
                            </td>
                            <td width='40px'>
                                <img className='fullscreen' src='./files/images/fullscreen.png' width='50%' onClick={ this.fullscreen } />
                            </td>
                        </tr>
                    </table>
                </div>
            </div>    
        )
    }

});