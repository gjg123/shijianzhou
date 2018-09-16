function TimePlay(options)	{
			var timePlay = this;
			timePlay.default_option = {
				speed: 3000,//播放速度
				startDate: 20180701,//开始日期
				endDate: 20180831,//借宿日期
				timeUnitControl: true,//是否显示时/天贴换控件
				container: '#timePlay',
				onClickChangeEnd: function(timePlay){},//点击后的回调
				onAnimateEnd: function(timePlay){}//时间轴动画每次结束回调
			};
			timePlay.options   = jQuery.extend(true, timePlay.default_option, options);//基本配置
			
			timePlay.initDoms();//初始化结构
			
			timePlay.timer     = null;//动画定时器
			timePlay.translate = 0;//时间轴位移
			timePlay.width     = 0;//时间轴长度
			timePlay.timeUnit  = '时';//单位
			timePlay.left      = $(".timeProgress-box").offset().left;//获取元素相对于文档的左偏移量
			timePlay.right     = $(window).width() - timePlay.left - $(".timeProgress-box").width();
			timePlay.dis       = $('.timeProgress-inner li').outerWidth();//运动每格长度,也就是li的宽度,该方法包含 padding 和 border
			timePlay.dis_hour  = timePlay.dis/24;//小时单位移动距离
			timePlay.curr_x    = 0;//临时记录X轴位移
			timePlay.temp_day  = {};//临时记录时间
			timePlay.curr_day  = {};//进度条时间
			timePlay.index_hover = 0;//临时索引
			timePlay.hover     = 0;//当前索引
			timePlay.delay     = false;//是否延迟
			timePlay.init();//初始化
		}


		TimePlay.prototype.initDoms = function(){//初始化dom
			var timePlay = this;
			$(timePlay.options.container).hide();
			var mainContainer = $('<div id="timeMain"></div>'),
			    timeUnitControl = '<div class="timeUnit"><div class="inner"><div class="timeUnitBtn">天</div><div class="timeUnitBtn active">时</div><div class="timeUnitBtnFen">分</div></div></div>',
			    playControl = '<div class="timeControl-box"><div class="timeControl play"></div></div>',
			    pageControl = '<div class="prev-box"><div class="prev" title="上一页"></div></div><div class="next-box"><div class="next" title="下一页"></div></div><div class="today">回到今天</div>',
			    timeAxis = '<div class="timeProgress-box"><div class="hover-popup"></div><div class="curr-popup for-click">17:00</div><div class="timeProgress-hide"><div class="timeProgress-inner"><div class="timeProgress"><div class="timeProgress-bar"><div class="curr-popup for-animate">17:00</div></div></div><ul></ul></div></div></div>';
			if(timePlay.options.timeUnitControl){
				$(timePlay.options.container).append(timeUnitControl);
			}
			$(timePlay.options.container).append(mainContainer);
			mainContainer.append(playControl).append(pageControl).append(timeAxis);
			timePlay.fillDate(timePlay.options.startDate,timePlay.options.endDate);
		}
		
		TimePlay.prototype.fillDate = function(start,end){
			var timePlay = this;
			var startYear  = Math.floor(start/10000),
					startMonth = Math.floor((start%10000)/100),
					startDay   = Math.floor(start%100),
					endYear    = Math.floor(end/10000),
					endMonth   = Math.floor((end%10000)/100),
					endDay     = Math.floor(end%100),
					datelist   = '';
					while((startDay!=endDay)||(startMonth!=endMonth)||(startYear!=endYear))
					{
						startDay++;
						if(startDay>timePlay.monthCount(startMonth)){
							startDay = 1;
							startMonth++;
						}
						if(startMonth>12){
							startMonth = 1;
							startYear++;
						}
						datelist+='<li class="every" data-year='+startYear+'><span class="mon">'+startMonth+'</span>/<span class="day">'+startDay+'</span></li>'
					}
		//		console.log(datelist)
				$(timePlay.options.container).show().find('ul').append(datelist);
		}
		
		TimePlay.prototype.monthCount = function(month) {
			var timePlay = this;
			var num = 0;
			if(month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
				num = 31;
			} else if(month == 4 || month == 5 || month == 9 || month == 11 ) {
				num = 30;
			} else if(month == 2) {
				if(timePlay.calcLeapYear()) {
					num = 29;
				} else {
					num = 28;
				}
			}
			return num;
		}
		
		TimePlay.prototype.init = function(){
			var timePlay = this;
			timePlay.initDate();//初始化日期
			
			$('.timeUnitBtn').on('click',function(){//切换显示单位
				var index = $(this).index();
				timePlay.changeTimeUnit(index);
			});
			
			$('.timeControl').on('click',function(){//时间轴播放暂停
				timePlay.play();
			});
			
			$('.timeProgress').on('mouseover',function(){
				timePlay.hoverPopup();
			})
			
			$('.timeProgress').on('click',function(){
				timePlay.clickPopup();
			})
			
			$(".next").on('click',function(){
				timePlay.pageNext();
			})
			
			$(".prev").on('click',function(){
				timePlay.pagePrev();
			})
			
			$(".today").on('click',function(){
				timePlay.stopPlay();
				timePlay.initDate();
			})
		}
		

		TimePlay.prototype.initDate = function(){//初始化日期
	var timePlay = this;
	var curr_date = new Date();
	console.log(curr_date)
	var year  = curr_date.getFullYear();
	var month = curr_date.getMonth()+1;
	var day = curr_date.getDate();
	var hour = curr_date.getHours();
	var minute = curr_date.getMinutes();
	var second = curr_date.getSeconds();
	
	
	$(".curr-popup").hide();
	$(".for-animate").show();
	timePlay.curr_day = {
												"year": year,
												"mon": month,
												"day": day,
												"hour": hour,
												"minute":minute,
												"second":second
												
									};
	$(".curr-popup").text(hour+minute+second);
	for (var i = 0, len = $('.every').length; i < len; i++) {
		var m = parseInt($('.every:eq('+i+') .mon').text());
		var d = parseInt($('.every:eq('+i+') .day').text());
		if(month==m&&day==d){
			timePlay.index = i;
			timePlay.width  = timePlay.dis * i + timePlay.dis / 24 * hour;
			timePlay.progressAni();
			break;
		}
	}
}
		
		TimePlay.prototype.progressAni = function(){//进度条动画
	var timePlay = this,
			page_width = $('.timeProgress-box').width(),
			con_width = $('.timeProgress-inner').width(),
			page_num = Math.floor(timePlay.width /page_width),
			left_dis = page_num * page_width;
			
	if(page_width - timePlay.width + left_dis < timePlay.dis){
		left_dis = left_dis + (page_width/2);
	}		
	
	if(left_dis+page_width>con_width + 40){
		left_dis = $('.timeProgress-inner').width() - page_width + 40;
		$(".prev").addClass('disable');
	}
	
	if((timePlay.width - left_dis)<timePlay.dis){
		left_dis = left_dis - (page_width/2);
	}
	timePlay.translate = left_dis;
	$('.timeProgress-inner').css({'transform': "translateX(-"+left_dis+"px)"});
	$('.timeProgress-bar').animate({
			width: timePlay.width ,
	},500,'linear');
}