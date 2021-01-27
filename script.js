var timetable = document.getElementById("timetable");
var template = timetable.innerHTML;
var finding_period = false;

var course_code_length = 8;
var course_sec_length = 3;

var default_block = {bg: "#d9d9d9", col: "#888888"}

// String.prototype.cleanup = function() {
//    return this.toLowerCase().replace(/[^a-z]+/g, "");
// }

function checkTextOverflow(){
	var spans = document.querySelectorAll(".day-col a span.text-marq");
	var margin_px = 5;
	var px_per_frame = 1;

	for(var span of spans) {
		var col_width = $(span.parentElement).width();

		if((span.offsetWidth - 2) < col_width) {
			$(span).removeClass("text-marq");
			continue;
		}
		// if(span.innerHTML.length > 19) {
		// should run

		var left = margin_px;

		if(span.style.left) {
			left = (parseInt(span.style.left) - px_per_frame);
		}

		if(left < (col_width - margin_px - span.offsetWidth)) {
			left = margin_px;
		}

		span.style.left = left + 'px';
		// span.style.marginLeft = left < margin_px ? 0 : ((margin_px - left) + 'px');
		span.style.visibility = (left === margin_px) ? 'hidden' : '';
		// }
	}
}

function isLab(obj) {

	// if this session is a Lab class
	if (obj.type ==="Lab") {
		var countLab = 0;

		// loop through courses list
		for(var course of courses_info) {

			// find Lab for this course
			if(course.code === obj.code && course.type === "Lab") {
				countLab++;

				// if more than one, then OK.
				if(countLab > 1){
					break;
				}
			}
		}
		return (countLab > 1);
	}
	else {
		return false;
	}
}

function match_course(content, with_section){

	if(with_section===true){
		return content.match(/[A-Za-z]{4}[0-9]{3,4}((\/[0-9]{3})*)?( )?(\([0-9]{3}\))?/g);
	}
	return null; // content.match(/[A-Za-z]{4}[0-9]{3,4}[^\n]*/g);
}

function match_course_with_index(content) {

	var result = [];
	var regex = /[A-Za-z]{4}[0-9]{3,4}[^\n]*/g;

	while((match = regex.exec(content)) !== null) {
		result.push({
			index: match.index,
			info: match[0]
		});
	}
	return result;
}



var courses = [
];
var allCourseMode = false;
var used_colors = {};
if(localStorage["coursesJson"]){
	var tmp_courses = JSON.parse(localStorage["coursesJson"]);
	var error_courses = [];

	var looked_courses = [];
	courses = [];

	for(var i=0; i<tmp_courses.length; i++){

		var this_courseCode = tmp_courses[i].code;

		if(looked_courses.indexOf(this_courseCode)>-1){
			continue;
		}

		looked_courses.push(this_courseCode);

		var found = false;

		for(var j=0; j<courses_info.length; j++){
			if(courses_info[j].code === this_courseCode){
				found = true;
				var skipThisSection = false;

				for(var k=0; k<tmp_courses.length; k++) {
					if(tmp_courses[k].code === this_courseCode && tmp_courses[k].isRemoved) {

						if(isLab(courses_info[j])
							&& courses_info[j].start === tmp_courses[k].start
							&& courses_info[j].day === tmp_courses[k].day) {

							skipThisSection = true;
						}
					}
				}

				if(skipThisSection) {
					var cloneObj = JSON.parse(JSON.stringify(courses_info[j]));
					cloneObj.isRemoved = true;
					courses.push(cloneObj);
				}
				else {
					courses.push(courses_info[j]);
				}
			}
		}

		if(found === false && this_courseCode.trim() !== ""){
			error_courses.push(this_courseCode);
		}
	}

	if(error_courses.length > 0){

		window.setTimeout(function(){
			alert("以下課程可能已被取消或更改：" + error_courses.join(", "));
		},1000);
	}
}
var totalHeight = 600;
var lineHeight = 12;
var dayName = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
var dayDisp = [
	"日(Sun)",
	"一(Mon)",
	"二(Tue)",
	"三(Wed)",
	"四(Thu)",
	"五(Fri)",
	"六(Sat)"
];
var errorDiv = document.getElementById("error");
var courseListDiv = document.getElementById("courselist");
var earliest = undefined;
var latest = undefined;
var heightOf1Min = 0;
var wrapper = document.getElementById("wrapper");
wrapper.style.height = (totalHeight + 60) + "px";
var hasUrlParam = false;

var versions = [];
var cur_ver = -1;
var max_ver = cur_ver;

Object.size = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if(obj[key] !== undefined){
			size++;
		}
	}
	return size;
};

var studyPlanDiv = document.getElementById("study-plan");
var studyPlanLink = document.getElementById("studyplan-link");
studyPlanLink.style.display = "none";

var profBtn = 0;

var searched_umacinfo = {};
var studyPlanHeader = "<b><i class=\"fa fa-list-alt\" aria-hidden=\"true\"></i> 可選擇的課程列表 Available Courses List</b>";

var allSlotItems = [];
var blackListSlot = [];
var selectedCourseCount = 0;

function getSelectedCourseCodeList(){
	var arr = [];

	for(var i=0; i<courses.length; i++){
		if(arr.indexOf(courses[i].code)===-1){
			arr.push(courses[i].code);
		}
	}
	return arr;
}

// function lockScrollToggle(){
// 	var body = document.getElementById("body");
// 	if(body.className === ""){
// 		body.className = "lockScreen";
// 	}
// 	else{
// 		body.className = "";
// 	}
// }
function changeValue(courseCode){
	document.getElementById("coursename").value = courseCode;
	return true;
}
var urlParam = window.location.search;
if(urlParam.indexOf("course=") > -1){
	var courseCode_param = urlParam.substr(urlParam.indexOf("course=")+7, course_code_length);
	changeValue(courseCode_param);
	add(courseCode_param);
	hasUrlParam = true;
}
// function lockToggle(){
// 	if(localStorage["lockMode"] && localStorage["lockMode"]==="lock"){
// 		localStorage["lockMode"] = "unlock";
// 	}
// 	else{
// 		localStorage["lockMode"] = "lock";
// 	}
// 	genIt(null, null, true);
// }
function convertToStamp(t){
	return (parseInt(t.substr(0,2)) * 60) + (parseInt(t.substr(3,2)) * 1);
}
function convertToDisp(t){
	if(t == '') {
		return t;
	}
	var time = convertToStamp(t);

	var hour = parseInt(time/60);
	var min = parseInt(time % 60);

	if(min < 10) {
		min = '0' + min
	}
	return hour + ":" + min;
}
function addToScreen(target, el, i){
	window.setTimeout(function(){
		target.appendChild(el);
	}, i);
}

var elCollection = [];
// var lastClick = {
// 	id: '',
// 	hash: ''
// };

function genIt(courses_list, no_scroll, is_ctrlZ){

	if(no_scroll && no_scroll===true){
		// window.scrollTo(0,0);
		// document.getElementById("courses-list").scrollTop = document.getElementById("isw-form").offsetTop;
	}
	else{

		// var target = 0;

		// if(studyPlanDiv.innerHTML !== ""){
		// 	target = studyPlanDiv.offsetTop;
		// }

		// window.scrollTo(0,document.getElementById("wrapper").offsetTop);
		// document.getElementById("courses-list").scrollTop = target;
		window.scrollTo(0,document.getElementById("wrapper").offsetTop);
	}

	courseListDiv.innerHTML = "";

//		courses = courses.sort(function(a,b){return a.code > b.code});
	var used_colors_list = used_colors;
	if(!courses_list){
		courses_list = courses;
		allCourseMode = false;
		document.getElementById("courses-list").className = "active";
	}
	else{
		allCourseMode = true;
		document.getElementById("courses-list").className = "inactive";
		for(var i=courses.length-1; i>=0; i--){
			courses_list.unshift(courses[i]);
		}
	}


	// if(
	// 	allCourseMode===true ||
	// 	(localStorage["lockMode"] && localStorage["lockMode"]==="lock")
	// ){
	// 	document.getElementById("overlay").className = "lock";
	// 	document.getElementById("lock").className = "lock";
	// 	localStorage["lockMode"] = "lock";
	// 	// document.getElementById("lock").innerHTML = "按此解鎖 Click to unlock<br><small>解鎖後，您將可以從課程表中刪除科目<br>Unlock to remove course(s) from timetable.</small>";
	// }
	// else{
	// 	document.getElementById("overlay").className = "unlock";
	// 	document.getElementById("lock").className = "unlock";
	// 	// document.getElementById("lock").innerHTML = "按此鎖定 Click to lock<br><small>鎖定課程表能避免誤刪課程<br>Lock to protect course(s) from removing.</small>";
	// }
	earliest = undefined;
	latest = undefined;
	timetable.innerHTML = template;
	document.getElementById("morning").style.height = 0 + "px";
	document.getElementById("night").style.height = 0 + "px";
	document.getElementById("afternoon").style.height = 0 + "px";

	elCollection = [];
	prettified = false;
	// save divs used in timetable rendering, for giving indent.

	var day = document.querySelectorAll(".col");
	for(var i=0; i<day.length; i++){
		day[i].style.height = totalHeight + 'px';
		elCollection[i] = [];
	}


	if(allCourseMode===false && !is_ctrlZ){
		cur_ver++;
		max_ver = cur_ver;
		versions[cur_ver] = JSON.stringify(courses_list);
	}

	if(cur_ver===0){
		document.getElementById("undo").className = "styled hidden";
	}
	else{
		document.getElementById("undo").className = "styled";
	}

	if(cur_ver===max_ver){
		document.getElementById("redo").className = "styled hidden";
	}
	else{
		document.getElementById("redo").className = "styled";
	}

	// dont print same section twice.
	var check_block_repeat = [];

	for(var i=courses_list.length-1; i>=0; i--){
		var ths_json = JSON.stringify(courses_list[i]);
		if(check_block_repeat.indexOf(ths_json)===-1){
			check_block_repeat.push(ths_json);
		}
		else{
			courses_list.splice(i, 1, {});
		}
	}

	for(var i=0; i<courses_list.length; i++){

		if(!courses_list[i].code || courses_list[i].isRemoved){
			continue;
		}

		var starttime;
		var endtime;

		if(!courses_list[i].startStamp){
			courses_list[i].startStamp = convertToStamp(courses_list[i].start);
		}
		if(!courses_list[i].endStamp){
			courses_list[i].endStamp   = convertToStamp(courses_list[i].end);
		}

		starttime = courses_list[i].startStamp;
		endtime   = courses_list[i].endStamp;

		if(!earliest || earliest > starttime){
			earliest = starttime;
		}
		if(!latest || latest < endtime){
			latest = endtime;
		}
	}
	if(earliest === undefined){
		earliest = 11.5*60;
		latest = 16.5*60;
	}
	else{
		if(earliest > (9*60 + 30)){
			earliest -= 30;
		}
		if(latest < (18*60)){
			latest += 30;
		}
		if(earliest > (12.5 * 60)){
			earliest = (12.5 * 60);
		}
		if(latest < (15.5 * 60)){
			latest = (15.5 * 60);
		}
	}
	heightOf1Min = totalHeight / (latest - earliest);

	timetable.className = (
			(allCourseMode===true) ? "adding-course" : "selected-course"
		);

	var renderGap = 5;

	for(var i=0; i<courses_list.length; i++){

		if(!courses_list[i].code || courses_list[i].isRemoved){
			continue;
		}
		var tmpLineHeight = lineHeight;
		var weekday = dayName.indexOf(courses_list[i].day);
		if(weekday > -1){
			if(allCourseMode === true){
				var basicHTML = courses_list[i].code + "<br>" + courses_list[i].start + "-" + courses_list[i].end + "<br>" + courses_list[i].venue;
				// var prevFound = false;
				// for(var k=0; k<i; k++){
				// 	if(
				// 		(courses_list[k].start === courses_list[i].start) &&
				// 		(courses_list[k].end === courses_list[i].end) &&
				// 		(courses_list[k].day === courses_list[i].day)
				// 	){

				// 		if(courses_list[i].code !== courses_list[k].code){
				// 			var div = document.getElementById(courses_list[k].code + "-" +courses_list[k].start + "-" +courses_list[k].end + "-" +courses_list[k].day);
				// 			div.innerHTML += "<hr>" + basicHTML;
				// 		}
				// 		prevFound = true;
				// 		break;
				// 	}
				// }
				// if(prevFound === true){
				// 	continue;
				// }
			}
			var div = document.createElement("a");
			var this_id = courses_list[i].code + "-" +courses_list[i].start + "-" +courses_list[i].end + "-" +courses_list[i].day;
			if(allCourseMode === false){
				if (isLab(courses_list[i])) {
					div.href = "javascript:removeSection(" + i + ")";
				}
				else {
					div.href = "javascript:deleteIt('" + courses_list[i].code + "')";
				}
			}
			else{
				div.href = "javascript:filterIt(" + weekday + "," + elCollection[weekday].length + ")";
			}
			div.style.top = parseInt((courses_list[i].startStamp - earliest) * heightOf1Min) + "px";
			var divHeight = ((courses_list[i].endStamp - courses_list[i].startStamp) * heightOf1Min - 12);
			div.style.height = parseInt(divHeight) + "px";
			var paddingTop = (divHeight - (tmpLineHeight*4)) / 2;
			if(allCourseMode === false){
				var basicHTML = courses_list[i].code + "<br><span class=\"text-marq\">" + courses_list[i].name + "</span><br>" + courses_list[i].venue + "<br>" + courses_list[i].start + "-" + courses_list[i].end;

				if(isLab(courses_list[i])) {
					basicHTML += '[Lab]';
				}

				if(paddingTop > 0){
				 	div.innerHTML = basicHTML;
				}
				else{
					tmpLineHeight = 12;
					var paddingTop = (divHeight - (tmpLineHeight*2)) / 2;
					div.innerHTML = courses_list[i].code + "<br>@" + courses_list[i].start + '/' + courses_list[i].venue;
				}
			}
			else{
				tmpLineHeight = 9;
				var paddingTop = 7;
				div.innerHTML = basicHTML;
				div.id = this_id;
			}
			var background = undefined;
			if(used_colors_list[courses_list[i].code]){
				background = used_colors_list[courses_list[i].code];
			}
			else if(allCourseMode === false){
				for(var k=0; k<colors.length; k++){
					var used = false;
					for(var h in used_colors_list){
						if(colors[k] === used_colors_list[h]){
							used = true;
							break;
						}
					}
					if(used === false){
						break;
					}
				}
				background = colors[k];
				used_colors_list[courses_list[i].code] = colors[k];
			}
			if(background === undefined){
				background = default_block.bg;
				div.style.color = default_block.col;
			}
			div.style.borderColor = background;
			div.style.lineHeight = tmpLineHeight + "px";
			if(allCourseMode === false){
				var span = document.createElement("span");
				span.className = "cross";
				span.innerHTML = "&times;";
				span.style.height = tmpLineHeight + "px";
				div.appendChild(span);
				var span = document.createElement("span");
				span.className = "alt-text";
				span.innerHTML = isLab(courses_list[i]) ? "[Lab]" : courses_list[i].code;
				span.style.height = tmpLineHeight + "px";
				div.appendChild(span);
			}
			var bgDiv = document.createElement("div");
			bgDiv.className = "background";
			bgDiv.style.backgroundColor = background;
			bgDiv.style.zIndex = -1;
			// var altText = document.createElement("div");
			// altText.className = "alt";
			// altText.innerHTML = basicHTML;


			// Calculate indent.
			var top = parseInt(div.style.top);
			var height = parseInt(divHeight);
			var bottom = top + height;
			var left = 0;

			for(var thisEC=0; thisEC<elCollection[weekday].length; thisEC++) {
				var el = elCollection[weekday][thisEC];
				if(el.top <= bottom && el.bottom >= top) {
					if(el.left >= left) {
						left = el.left + 21;
					}
					// if(el.paddingTop >= paddingTop){
					// 	if(el.paddingTop < height/3*2) {
					// 		paddingTop = el.paddingTop + 3;
					// 	}
					// 	else{
					// 		paddingTop += 3;
					// 	}
					// }
				}
			}
			if(paddingTop > 0){
				div.style.paddingTop = parseInt(paddingTop) + "px";
				div.style.height = parseInt(divHeight - paddingTop) + "px";
			}
			else{
				div.style.paddingTop = "0px";
			}

			if(left > 90) {
				left = 90;
			}

			elCollection[weekday].push({
				code: courses_list[i].code,
				background: background,
				top: top,
				paddingTop: paddingTop,
				bottom: bottom,
				left: left
			});

			div.style.left = left + 'px';
			div.appendChild(bgDiv);
			// div.appendChild(altText);
			addToScreen(day[weekday], div, i*renderGap);
		}
	}

	var returnAt = (i+1) * renderGap;

	var morning_height = 0;
	var night_height = 0;
	if(earliest < (13*60)){
		morning_height = (13*60 - earliest);
	}
	if(latest > (18*60)){
		night_height = (latest - 18*60);
	}
	if(morning_height < 1){
		morning_height = 0;
	}
	else{
		morning_height = morning_height * heightOf1Min + (lineHeight/2);
	}
	night_height = night_height * heightOf1Min - (lineHeight/2);
	document.getElementById("morning").style.height = morning_height + "px";
	document.getElementById("morning").style.lineHeight = morning_height + "px";
	if(morning_height < 48){
		document.getElementById("morning").style.lineHeight = 1 + "px";
	}
	if(night_height < 30){
		night_height = 0;
	}
	document.getElementById("night").style.height = night_height + "px";
	document.getElementById("night").style.lineHeight = night_height + "px";

	var afternoon_height = totalHeight - night_height - morning_height;
	morning_height += 35;
	document.getElementById("afternoon").style.top = morning_height + "px";
	document.getElementById("afternoon").style.height = afternoon_height + "px";
	document.getElementById("afternoon").style.lineHeight = afternoon_height + "px";
	for(var i=earliest; i<latest; i+=30){
		var stampTop = ((i - earliest) * heightOf1Min - (lineHeight/2));
		var stamp = document.createElement("div");
		stamp.style.height = (heightOf1Min * 30) + "px";
		stamp.style.top = stampTop + "px";
		var hour = parseInt(i/60);
		var min = (i - (hour*60));
		if(min < 10){
			min = '0' + min;
		}
		stamp.innerHTML = hour + ":" + min;
		day[0].appendChild(stamp);
	}
	var previousCourse = "";

	// if(allCourseMode===true){
	// 	var div_umacinfo = document.getElementById("umacinfo");
	// 	div_umacinfo.className = "";
	// 	div_umacinfo.innerHTML = "";

	// 	var ccode = document.getElementById("coursename").value;

	// 	if(window.jQuery){
	// 		$.get(
	// 			"umac_info.php",
	// 			{course: ccode},
	// 			function(data){
	// 				div_umacinfo.className = "umac-info";
	// 				div_umacinfo.innerHTML = data.replace(/style="[^"]*"/g, "");
	// 			}
	// 		);
	// 	}
	// }

	// for(var i=courses_list.length-1; i>=0; i--){
	for(var i=0; i<courses_list.length; i++){

		if(!courses_list[i].code || courses_list[i].isRemoved){
			continue;
		}
		if(courses_list[i].code !== previousCourse){
			previousCourse = courses_list[i].code;
			var li = document.createElement("li");

			var no_remark = courses_list[i].remark.replace(/\s/g, "")==="";
			var no_dept = (courses_list[i].host && (courses_list[i].host.replace(/\s/g, "")===""));

			li.innerHTML = '<h3><span style="background:' + used_colors_list[courses_list[i].code] + '"></span>' + courses_list[i].code + "</h3>" +
							"<p>" + courses_list[i].name + "</p>" +
							"<ul id='" + courses_list[i].code + "'></ul>" +
							((courses_list[i].prof.replace(/\s/g, "")==="")
								? ""
								: "<p><u>講師 Lecturer</u><br>" + courses_list[i].prof + "</p>") +
							((no_dept && no_remark)
								? ''
								: '<p><u>備註 Remark</u>' +
								(no_dept
									? ''
									: '<br>Host by ' + courses_list[i].host + '; ') +
								(no_remark
									? ''
									: courses_list[i].remark.replace(/\n/g, "<br>")) +
								'</p>'
							) +
							'<a href="javascript:add(\'' +courses_list[i].code+ '\')" class="add">加入 Add</a><a href="javascript:deleteIt(\'' +courses_list[i].code+ '\')" class="del">刪除 Delete</a>';
			if(allCourseMode===true){

				var current_course_code_list = getSelectedCourseCodeList();

				// if(current_course_code_list.indexOf(courses_list[i].code)!==-1){
				if(i < courses.length){
					li.className = "inactive";
				}
				else{
					li.className = "inlist";
				}
			}
//				courseListDiv.insertBefore(li, courseListDiv.querySelector("li"));
			courseListDiv.appendChild(li);
		}
		var dayIndex = dayName.indexOf(courses_list[i].day);
		if(dayIndex > -1){

			var ths = courses_list[i];
			var ths_id = ths.code + '-' + ths.day + '-' + ths.startStamp + '-' + ths.endStamp;

if(!document.getElementById(ths_id)){

	ul = document.getElementById(ths.code);

	var li_el = document.createElement("li");
	li_el.id = ths_id;

	if (allCourseMode!==true && isLab(ths)) {
		var btnColor = used_colors_list[courses_list[i].code];

		if(!btnColor) {
			btnColor = "#607d8b";
		}
		li_el.className = "no-dots";
		li_el.innerHTML += "<a href=\"javascript:removeSection("+i+")\" class=\"course-hide\" style=\"color: " + btnColor + "\"><i class=\"fa fa-trash-o\" title=\"Hide\"></i></a>";
	}

	li_el.innerHTML += "<b>" + dayDisp[dayIndex] + " " + ths.start + "-" + ths.end + "</b><br>"+ ths.venue + (ths.type==='Lecture' ? '' : "(" + ths.type + ")");

	// console.log(ths.code);

	for(var ix in courses){

		var oppose = courses[ix];

		if(oppose.isRemoved) {
			continue;
		}

		if(
			oppose.code !== ths.code
			&& oppose.day === ths.day
			&& (
				(oppose.startStamp <= ths.startStamp && oppose.endStamp >= ths.startStamp)
				|| (oppose.startStamp <= ths.endStamp && oppose.endStamp >= ths.endStamp)
				|| (oppose.startStamp >= ths.startStamp && oppose.endStamp <= ths.endStamp)
			)
		){
			li_el.innerHTML += "<br><span class=\"warning\">與" + oppose.code + "衝突</span>";
		}
		// console.log(oppose.code, ths.code);
	}

	ul.appendChild(li_el);
}
		}
	}
	if(allCourseMode === false){
		localStorage["coursesJson"] = JSON.stringify(courses_list);
		used_colors = used_colors_list;
	}

	var als_count = 0;
	var als = document.querySelectorAll("#courselist li.inlist ul");
	
	if(als.length===0) {
		als = document.querySelectorAll("#courselist li ul");
	}

	for(var i=0; i<als.length; i++) {
		if(als[i].innerHTML === ''){
			als_count++;
		}
	}

	var als_total = als.length;

	if(als_count > 0) {
		var als_text_chi, als_text_eng, als_text_eng_count;

		als_text_eng_count = 's are ';

		if(als_count === als_total) {
			als_text_chi = '全部課程';
			als_text_eng = 'All';
		}
		else{
			als_text_chi = als_total + '個課程中有' + als_count + '個';
			als_text_eng = als_count + ' of ' + als_total;

			if(als_count===1){
				als_text_eng_count = ' is ';
			}
		}
		
		alert('所選的' + als_text_chi + '未有上課時間 / ' + als_text_eng + ' selected course' + als_text_eng_count+ 'unscheduled.')
	}

	// if(callback_function) {
	// 	window.setTimeout(callback_function, returnAt);
	// }
	if(finding_period===true){
		return find_period(true);
	}
	return true;
}
function print_error(msg, code){

	var span_id_str = " class='others'";
	if(code){
		span_id_str = ' class="'+code+'"';
	}

	if(errorDiv.innerHTML.indexOf(msg) === -1){
		errorDiv.innerHTML += "<span" + span_id_str + ">" + msg + "</span>";
	}
	
	window.scrollTo(0,document.getElementById("table-top").offsetTop);
	document.getElementById("courses-list").scrollTop = 0;
}
function removeError(code){

	// remove specific error.
	if(code){
		var er = document.querySelectorAll("." + code);
		for(var el=0; el<er.length; el++){
			errorDiv.removeChild(er[el]);
		}
	}

	// remove other error => keep COURSE ERROR.
	var er = document.querySelectorAll(".others");
	for(var el=0; el<er.length; el++){
		errorDiv.removeChild(er[el]);
	}
}

var courses_list_tmp = [];
var prettified = false;

function removeElement(element) {
	element.parentNode.removeChild(element);
}

function prettifyDisp(day, elCollectionIndex){
	prettified = true;

	var weekday = document.querySelectorAll(".col");
	var baseClass = "col day-col";
	for(var i=1; i<weekday.length; i++) {
		if(i !== day) {
			// removeElement(weekday[i]);
			weekday[i].className = baseClass + " other-col";
			weekday[i].style.width = "40px";
		}
		else{
			if(weekday[i].className.indexOf("active-col") !== -1){
				// user clicked on the active day, should return add.

				return add(elCollection[i][elCollectionIndex].code);
			}
			weekday[i].style.width = "580px";	// 825 - 245
			weekday[i].className = baseClass + " active-col";
		}
	}
	return prettifyDisp_proc(elCollection[day]);
}

function prettifyDisp_proc(elCollection){

	var other_els = document.querySelectorAll(".col.day-col.other-col a");
	for(var i=0; i<other_els.length; i++) {
		// other_els[i].href = "javascript:void(0)";
		other_els[i].style.left = "0px";
		other_els[i].style.width = "auto";
	}

	var total_width = parseInt(document.querySelector(".col.day-col.active-col").style.width);
	var margins_width = 12;	// course-block margin width

	var solvedConflicts = [];
	var els = document.querySelectorAll(".col.day-col.active-col a");

	for(var ths_i=0; ths_i<elCollection.length; ths_i++) {

		if(solvedConflicts.indexOf(ths_i) > -1){
			continue;
		}

		var conflicts = [];
		var ths = elCollection[ths_i];

		for(var tht_i=ths_i+1; tht_i<elCollection.length; tht_i++) {
			var tht = elCollection[tht_i];
			if(tht.top <= ths.bottom && tht.bottom >= ths.top) {
				conflicts.push(tht_i);
				solvedConflicts.push(tht_i);
			}
		}
		if(conflicts.length > 0) {
			conflicts.unshift(ths_i);
			// console.log(total_width, total_width / conflicts.length);
			var el_margin = 8;
			var el_total_width = parseInt((total_width - el_margin) / conflicts.length * 10) / 10;
			var el_width = el_total_width - margins_width - 1;

			for(var i=0; i<conflicts.length; i++) {
				els[conflicts[i]].style.width = (el_width + el_margin) + "px";
				els[conflicts[i]].style.left = (el_total_width * i) + "px";
				// console.log(els[conflicts[i]], conflicts[i], el_width, (el_total_width * i));
			}
		}
	}
}

function filterIt(day, elCollectionIndex) {


	if(prettified === false){
		var this_course_el = elCollection[day][elCollectionIndex];
		var coursecode = this_course_el.code;
		var this_cl_tmp = [coursecode];

		// Day by day
		// for(var day=0; day<elCollection.length; day++) {

			// courses in one day
			// for(var i=0; i<elCollection[day].length; i++) {

				// if course found
				// if(elCollection[day][i].code === coursecode) {

					// find conflict courses.
					for(var j=0; j<elCollection[day].length; j++) {

						// avoid same course
						if(j !== elCollectionIndex) {

							var thisC = elCollection[day][elCollectionIndex];
							var thatC = elCollection[day][j];

							if(thatC.bottom >= thisC.top && thatC.top <= thisC.bottom && thatC.background === default_block.bg) {
								// overlap

								if(this_cl_tmp.indexOf(thatC.code) === -1) {
									this_cl_tmp.push(thatC.code);
									break;
								}
							}
						}
					}
				// }
			// }
		// }

		if(this_cl_tmp.length === 1){
			return add(coursecode);
		}
	}
	// for(var i = courses_list_tmp.length-1; i>=0; i-- ){ 

	// 	if(this_cl_tmp.indexOf(courses_list_tmp[i].code) === -1) {
	// 		courses_list_tmp.splice(i,1);
	// 	}
	// }
	// return genIt(courses_list_tmp);
	return prettifyDisp(day, elCollectionIndex);


	// var this_hash = day +"#" + elCollectionIndex;
	// if(lastClick.hash===this_hash){
	// 	return add(coursecode);
	// }

	// var shouldQuit = (lastClick.id === this_id);
	// lastClick.id = this_id;
	// lastClick.hash = this_hash;

	// if(shouldQuit===true) {
		// return prettifyDisp();
	// }
}

function look(coursecode, is_error, is_importing){

	// var courses_list_current = getSelectedCourseCodeList();
	courses_list_tmp = [];

	for(var i=0; i<courses_info.length; i++){
		// console.log(courses_info[i].code.substr(0,course_code_length), coursecode);

		if(courses_info[i].code.substr(0,course_code_length) === coursecode.substr(0,course_code_length)){
			// && courses_list_current.indexOf(courses_info[i].code)===-1){
			courses_list_tmp.push(courses_info[i]);
		}
	}
	if(courses_list_tmp.length < 1) {
		// 可能是舊制

		var cur_target = '';

		for(var ci=0; ci<courses_info.length; ci++){

			if(cur_target !== '') {
				if(courses_info[ci].code.substr(0,course_code_length) === coursecode.substr(0,course_code_length)){
					// && courses_list_current.indexOf(courses_info[ci].code)===-1){
					courses_list_tmp.push(courses_info[ci]);
				}
			}
			else{
				if(courses_info[ci].name.indexOf(coursecode.substr(0,7))>-1){
					cur_target = courses_info[ci].code;
					courses_list_tmp.push(courses_info[ci]);
				}
			}
		}
	}


	if(courses_list_tmp.length < 1){
		print_error(coursecode+": 課程不存在 / Course not found.");
	}
	else{
		if(is_importing && is_importing===true){

			if(is_error && is_error===true){
				print_error(coursecode+": 該課程有兩個Lab，請在下方輸入課程編號並手動選擇 / Two labs are found, type course code and select your lab.", coursecode);
			}
		}
		else{

			// if(window.jQuery && onServer===true){
			// 	$.post(
			// 		"check_look_func_available.php",
			// 		{content: coursecode},
			// 		checkAvailable
			// 	);
			// }

			if(is_error && is_error===true){
				print_error(coursecode+": 請選擇一個Section / Choose a section.", coursecode);
			}
			else{
				removeError(coursecode);
			}
		}
		genIt(courses_list_tmp);
	}
}
function add(coursecode, is_importing, should_remain){

	if(!(should_remain && should_remain===true)){
		// window.setTimeout(function(){
		// 	document.getElementById("courses-list").scrollTop = 0;
		// },300);
	}

	if(!(is_importing && is_importing===true)){
		is_importing = false;
		removeError();
	}

	document.getElementById("suggestion").innerHTML = "";

	if(Object.size(used_colors) >= colors.length){
		print_error("請先刪除一些科目再繼續 / Drop some courses first.");
		return;
	}
	if(!coursecode){
		var code_raw = document.getElementById("coursename").value;
	}
	else{
		var code_raw = coursecode;
	}
	code_raw = code_raw.replace(/ /g, "").toUpperCase();

	document.getElementById("coursename").value = code_raw.split("-")[0];
	localStorage["prSrchText"] = code_raw;

	if(code_raw.length < (course_code_length + course_sec_length)){
		look(code_raw, null, is_importing);
		return;
	}
	var code = code_raw.substr(0,course_code_length) + "-" + code_raw.substr(-course_sec_length);

	// if(window.jQuery && onServer===true && is_importing===false){
	// 	$.post(
	// 		"check_add_func_available.php",
	// 		{content: code},
	// 		checkAvailable
	// 	);
	// }

	var existed = false;
	for(var i=0; i<courses.length; i++){
		if(courses[i].code === code){
			existed = true;
			break;
		}
	}
	if(existed === true){

		if(is_importing===false){
			print_error(code_raw+": 課程已在課程表中 / Course is in timetable.");
		}
		return genIt();
	}
	var count = 0;
	for(var i=0; i<courses_info.length; i++){
		// console.log(courses_info[i].code, code);
		if(courses_info[i].code === code){
			courses.push(courses_info[i]);
			count++;
		}
	}
	if(count === 0){
		return look(code_raw.substr(0,course_code_length), true, is_importing);
	}
	else{

		if(is_importing===false){
			removeError();
		}
		// document.getElementById("coursename").value = "";
		// localStorage["lockMode"] = "unlock";
	}
	genIt()
}
function clear_input(){
	document.getElementById("coursename").value = "";
	fetchIt();
	genIt(null, true);
}

// function keepOnly(i) {
// 	var this_courseCode = courses[i].code;
// 	var hasRemovedAnySection = false;

// 	for(var j=0; j<courses.length; j++) {
// 		if(courses[j].code === this_courseCode && isLab(courses[j])){
// 			if(j !== i){
// 				if(courses[j].isRemoved) {
// 					hasRemovedAnySection = true;
// 					break;
// 				}
// 				courses[j].isRemoved = true;
// 			}
// 		}
// 	}

// 	if(hasRemovedAnySection) {
// 		// add all section back

// 		for(var j=0; j<courses.length; j++){
// 			if(courses[j].code === this_courseCode && isLab(courses[j])){
// 				delete courses[j].isRemoved;
// 			}
// 		}
// 	}
// 	genIt(null, true);
// }

function removeSection(i){
	courses[i].isRemoved = true;

	var this_courseCode = courses[i].code;
	var totalLab = 0;
	var totalRemovedLab = 0;

	for(var j=0; j<courses.length; j++) {
		if(courses[j].code === this_courseCode && isLab(courses[j])){
			totalLab++;

			if(courses[j].isRemoved) {
				totalRemovedLab++;
			}
		}
	}

	// if all labs are removed
	if(totalRemovedLab === totalLab) {
		// add back all the lab.

		alert(this_courseCode + ": 你不可以移除全部Lab。");

		for(var j=0; j<courses.length; j++){
			if(courses[j].code === this_courseCode && isLab(courses[j])){
				delete courses[j].isRemoved;
			}
		}
	}
	genIt(null, true);
}
function deleteIt(courseCode){
	// if(window.jQuery && onServer===true){
	// 	$.post(
	// 		"check_drop_func_available.php",
	// 		{content: courseCode},
	// 		checkAvailable
	// 	);
	// }
	for(var i=courses.length-1; i>=0; i--){
		if(courses[i].code === courseCode){
			delete courses[i].isRemoved;
			courses.splice(i, 1);
		}
	}
	used_colors[courseCode] = undefined;
	genIt();

}

var timeout = undefined;

function fetchIt(){
	var input = document.getElementById("coursename").value.toUpperCase();
	var input_original = input;

	input = input.replace(/ /g, "");

	document.getElementById("suggestion").innerHTML = "";

	var max_suggest = 999;
	var min_suggest = 10;

	if(input.length < 1){
		return false;
	}
	else if(input.length < 4){
		max_suggest = 10;
	}

	var added = [];
	var added_last = [];
	var added_other = [];

	var added_div = [];
	var added_last_div = [];
	var added_other_div = [];

	var resultDiv = document.getElementById("suggestion");

	/*==
		完整邏輯：

		(A) 首字為 X 的
			=> match_index === 0
			[added]

		(B) 包含 X 的
			=> match_index > 0
			[added_last]

		(C) 兩者皆無結果
			=> 課程標題包含 X 的
			=> match_content_index >= 0
			[added_other]
	==*/

	for(var i=0; i<courses_info.length; i++){

		//input === courses_info[i].code.substr(0, input.length)

		var match_index = courses_info[i].code.indexOf(input);
		var match_content_index = -1;
		var match_prof_index = -1;

		// if course code not match, search course title.
		if(match_index < 0){
			match_content_index = courses_info[i].name.toUpperCase().indexOf(input_original);

			if(match_content_index < 0){
				match_prof_index = courses_info[i].prof.toUpperCase().indexOf(input_original);
			}
		}

		if(match_index >= 0
			|| match_content_index >= 0
			|| match_prof_index >= 0){

			var coursecode = courses_info[i].code.substr(0, course_code_length);

			if(added.indexOf(coursecode) === -1
				&& added_last.indexOf(coursecode) === -1
				&& added_other.indexOf(coursecode) === -1){

				var coursename = courses_info[i].name.toLowerCase();

				if(match_content_index >= 0){
					coursename = coursename.replace(input_original.toLowerCase(), "<span>"+input_original.toLowerCase()+"</span>");
				}
				if(match_prof_index >= 0){
					coursename += "<br><font style='font-weight:normal;text-transform:none'>- Prof: " + courses_info[i].prof.toLowerCase().replace(input_original.toLowerCase(), "<span>"+input_original+"</span>") + '</span>';
				}

				var li = document.createElement("li");
				var a = document.createElement("a");
				a.innerHTML = "<b>" + coursecode.replace(input, "<span>"+input+"</span>") + "</b><br>" + coursename + "</a>";
				a.href = "javascript:add('" + coursecode + "')";
				li.appendChild(a);
				// document.getElementById("suggestion").appendChild(li);

				if(match_index===0){

					// added.indexOf 只能搜尋字串
					added.push(coursecode);

					// 把 element 儲存
					added_div.push({
						code: coursecode,
						el: li
					});
				}
				else if(added.length < min_suggest){

					if(match_content_index >= 0 || match_prof_index >= 0){

						// added_other.indexOf 只能搜尋字串
						added_other.push(coursecode);

						// 把 element 儲存
						added_other_div.push({
							code: coursecode,
							el: li
						});
					}
					else{

						// added_last.indexOf 只能搜尋字串
						added_last.push(coursecode);

						// 把 element 儲存
						added_last_div.push({
							code: coursecode,
							el: li
						});
					}
				}
			}
		}
	}

	var count_i = 0;

	// 把 non-first char match 的都放進去，湊齊10個
	while(added_div.length < min_suggest) {

		if(!added_last_div[count_i]){
			break;
		}
		added_div.push(added_last_div[count_i++]);
	}

	count_i = 0;

	// 把 title match 的都放進去，湊齊10個
	while(added_div.length < min_suggest) {

		if(!added_other_div[count_i]){
			break;
		}
		added_div.push(added_other_div[count_i++]);
	}

	for(var i=0; i<added_div.length; i++){

		if(i >= max_suggest){
			break;
		}
		resultDiv.appendChild(added_div[i].el);
	}

	if(added_div.length === 0){
		resultDiv.innerHTML += "No Result.";
	}
}
function getsuggestion(){
	if(timeout !== undefined){
		window.clearInterval(timeout);
	}
	timeout = window.setTimeout(function(){
		fetchIt();
	}, 300);
}

function find_multi_lab(){
	var prev = "";
	var c = 0;
	for(var r of courses_info){
		if(r.code !== prev){

		if(c > 1)
			console.log(prev, c);

			prev = r.code;
			c = 0;
	    }
		if(r.type!=="Lecture"){
			c++;
	    }
	}
}

var pref_isw_value = "";

function loadPrevIsw(){
	pref_isw_value = "";

	if(!localStorage["prIswText"]){
		localStorage["prIswText"] = "沒有內容 / No Content.";
	}
	document.getElementById("isw").value = localStorage["prIswText"];
}

function addIsw(){

	removeError();

	var content = document.getElementById("isw").value;
	localStorage["prIswText"] = content;

	document.getElementById("isw").value = "";

	if(content === pref_isw_value && pref_isw_value !== ""){
		return print_error("文字已被匯入 / Text are imported.");
	}
	else{
		pref_isw_value = content;
	}

	// 從文字中提取課程編號(可能包括Section Number)
	var tmp_im_courses = match_course(content, true);

	// if(window.jQuery && onServer===true){
	// 	$.post(
	// 		"check_isw_func_available.php",
	// 		{content: content},
	// 		checkAvailable
	// 	);
	// }

	var im_courses = [];
	// var had_repeat = false;

	var is_isw = content.indexOf("Compulsory Major Courses") !== -1;

	// var repeated_i = [];
	// 
	// if(tmp_im_courses){
	// 	for(var i=0; i<tmp_im_courses.length; i++){
	// 
	// 		// 部份課程會在一個或多個領域出現, 要去掉重覆的課程
	// 		if(im_courses.indexOf(tmp_im_courses[i]) === -1){
	// 			im_courses.push(tmp_im_courses[i]);
	// 		}
	// 		else{
	// 			// had_repeat = true;
	// 			repeated_i.push(i);
	// 		}
	// 	}
	// }

	// 新 - 保留重覆
	im_courses = tmp_im_courses;

	if(im_courses.length === 0){
		return print_error("您複製的文字中並未包含任何課程編號 / No course code is included in the copied text.");
	}
	// else if(content.indexOf("Student Information") < 0
	// 	|| content.indexOf("Timetable for") < 0){

	// 	return print_error("無法辨識時間表或Study Plan / Unable to identify timetable or study plan.");
	// }
	// else if(content.indexOf("Student Information") >= 0){
	// else if(!had_repeat){
	else if(is_isw){
		// is study plan

		var course_categories = [];
		var regex = /((in)?complete)\s+([a-z]{2})\t/ig;

		while((match = regex.exec(content)) !== null) {
			course_categories.push({
				index: match.index,
				completed: match[2]===undefined,
				cat_code: match[3]
			});
			// console.log(match);
		}

		var course_categories_smaller = [];
		var regex = /([^\n]+)\n([^\n]*\n)?[^\n]*[0-9]{1,2} credit(s)?/ig;

		while((match = regex.exec(content)) !== null) {

			var this_title = match[1].trim();

			if(this_title===''){
				this_title = match[2].trim();
			}

			if(this_title.indexOf("credit") > -1) {
				// skip.
			}
			else{
				course_categories_smaller.push({
					index: match.index,
					title: this_title
				});
			}
		}

		var im_courses_detail = match_course_with_index(content);

		// 上面去掉了重覆的課程, 這裡也要一同去掉
		// for(var c=0; c<repeated_i.length; c++){
		// 	im_courses_detail.splice(repeated_i[c], 1);
		// }

		// 將已修畢的領域去除
		var rid = 0;
		for(var cid=0; cid<course_categories.length; cid++) {

			var max;

			if(!course_categories[cid+1]) {
				max = content.length;
			}
			else {
				// 以下一分類為終止界
				max = course_categories[cid+1].index;
			}

			// 一開始的 rid 是本分類的首項
			while(rid < im_courses_detail.length) {

				// 若課程的 indexOf 比下一終止界小
				if(im_courses_detail[rid].index < max) {

					if(course_categories[cid].completed === false) {
						// 若本分類未修畢

						im_courses_detail[rid].cat_code = course_categories[cid].cat_code;
					}
					else{
						// 否則，已修畢的則不顯示了
						im_courses_detail[rid] = null;
					}
				}
				else {
					break;
				}

				rid++;
			}
		}

		finding_period = false;

		studyPlanLink.style.display = "inline-block";
		studyPlanDiv.innerHTML = "<hr class='full'><p>"+studyPlanHeader+"</p><p>&nbsp;</p>";

		// console.log("im_courses", im_courses);

		for(var i=im_courses.length-1; i>=0; i--){
			// if(im_courses.indexOf(im_courses[i]) < i){
			// 	// 本課程第二次出現
			// 	im_courses.splice(i, 1);
			// 	im_courses_detail.splice(i, 1);
			// }
			// else
				if(
				!im_courses_detail[i]
				|| !im_courses_detail[i].info
				|| im_courses_detail[i].info.indexOf(")Completed")!==-1
				|| im_courses_detail[i].info.indexOf(")In Progress")!==-1
			){
				im_courses.splice(i, 1);
				im_courses_detail.splice(i, 1);
			}
			else{
				var cs_found = false;
				var ci;
				var cc_substr;
				for(ci=0; ci<courses_info.length; ci++){

					cc_substr = courses_info[ci].code.substr(0,course_code_length);

					if(cc_substr === im_courses[i]
						|| courses_info[ci].name.indexOf(im_courses[i])>-1){
						cs_found = true;
						break;
					}
				}

				if(cs_found===false){
					im_courses.splice(i,1);
					im_courses_detail.splice(i, 1);
				}
				else{
					var parent_cat_index = content.lastIndexOf("credit", im_courses_detail[i].index);
					var cat_title = '';

					for(var cik=course_categories_smaller.length-1; cik>=0; cik--) {
						if(course_categories_smaller[cik].index < parent_cat_index) {
							cat_title = course_categories_smaller[cik].title;
							break;
						}
					}

					im_courses[i] = {
						code: cc_substr,
						text: courses_info[ci].name + "<br><span style='color: #ccc'>" + im_courses_detail[i].cat_code + ': ' + cat_title + "</span>"
					};

				}
			}
		}

		// console.log("im_courses", im_courses);

		for(var i=0; i<im_courses.length; i++){
			var p = document.createElement("p");
			p.innerHTML = '<a href="javascript:add(\'' + im_courses[i].code + '\',null,false)">' +
				'<b>' + im_courses[i].code + '</b><br><small>' + im_courses[i].text + '</small></a>';

			studyPlanDiv.appendChild(p);
		}
		// document.getElementById("courses-list").scrollTop = studyPlanDiv.offsetTop;

	}
	else{

		for(var i=0; i<im_courses.length; i++){
			add(im_courses[i].replace(/[\(\)]/g,""), true);
		}
	}
}



var totalSort = {};

// function draw_diagram(less_arr_fromObj, color){

// 	var str_l = "";

// 	less_arr_fromObj.sort(function(a,b){
// 		return convertToStamp(a.timeslot) - convertToStamp(b.timeslot);
// 	})


// 	for(var i in less_arr_fromObj){
// 		str_l += "<br><small>" + less_arr_fromObj[i].timeslot + " - " + less_arr_fromObj[i].count + " 節</small>";

// 	// 把每座大樓都Loop一次
// 		var count_total = 0;
// 		var count_total_obj = [];

// 		var max_percent = 0;
// 		var max_count = 0;

// 		for(var j in less_arr_fromObj[i]){
// 			if(j !== "timeslot" && j !== "count"){
// 				count_total++;

// 				var thscount = parseInt(less_arr_fromObj[i][j]);
// 				var count_wholeBuilding = parseInt(less_arr_fromObj[i].count);

// 				var percent = (thscount / count_wholeBuilding).toFixed(1);

// 				count_total_obj.push({
// 					venue: j,
// 					perc: percent,
// 					count: thscount
// 				});

// 				if(!totalSort[j]){
// 					totalSort[j] = 0;
// 				}
// 				totalSort[j] += thscount;

// 				if(thscount > max_count){
// 					max_percent = percent;
// 					max_count = thscount;
// 				}
// 			}
// 		}

// 		str_l += '<div>';

// 		// 左邊文字佔據 30%.
// 		var total_width = (100-30);	// in percent

// 		if(max_count < 10){
// 			total_width = 30;	// in percent
// 		}

// 		// 按課堂數量多少,倒序排列
// 		count_total_obj.sort(function(a,b){return b.perc - a.perc});

// 		for(v in count_total_obj){

// 			console.log(total_width, count_total_obj[v].perc, max_percent, total_width * count_total_obj[v].perc / max_percent);

// 			var bar_width = parseInt(total_width * count_total_obj[v].perc / max_percent);
// 			var bar_height = 20;

// 			if(bar_width < 2){
// 				bar_width = 2;
// 			}

// 			str_l += '<div><div style="width:' + 28 + '%;padding-right:' + 2 + '%;display:inline-block;vertical-align:middle;text-align:right;color:'+color+';font-size:13px;font-weight:bold;">' + count_total_obj[v].venue + ' / ' + count_total_obj[v].count + '</div>'
// 			 + '<div style="width:' + bar_width + '%;height:' + bar_height + 'px;display:inline-block;margin:3px 0;background:'+color+';vertical-align:middle"></div></div>';
// 		}

// 		str_l += '</div>';
// 	}

// 	console.log(totalSort);

// 	return str_l;
// }


// For umeh.top
function checkProfBtn(btn, params) {

	var profBtnFail = function(btn) {
		var btnId = "#prof-" + btn;
		$('<br><span class="umacinfo"><i class="fa fa-user-times" aria-hidden="true"></i> 未有此教授的資料 Professor info not found</span>').insertAfter(btnId);
		$(btnId).hide();
	};
	var profBtnSuccess = function(btn, text) {
		var btnId = "#prof-" + btn;
		$(btnId).append(text);
	};

	if(params in searched_umacinfo) {
		if(searched_umacinfo[params].error === true) {
			return profBtnFail(btn);
		}
		else{
			return profBtnSuccess(btn, searched_umacinfo[params].text);
		}
	}

	if(window.jQuery){
		$.getJSON(
			"https://mpserver.umeh.top/all_comment_info/" + params,
			{}
		).done(function(data){
			var marks = data.prof_info.result;
			var star_levels = ["star-o", "star-half-o", "star"];
			var star_enum = 2;

			if(marks <= 4) {
				star_enum = 1;
			}
			if(marks <= 1) {
				star_enum = 0;
			}

			var text = ' (<i class="fa fa-' + star_levels[star_enum] + '" aria-hidden="true"></i>' + marks.toFixed(1) + '/5)';
			profBtnSuccess(btn, text);

			searched_umacinfo[params] = {
				error: false,
				text: text
			}
		}).fail(function(){
			profBtnFail(btn);

			searched_umacinfo[params] = {
				error: true
			}
		});
	}
}

function find_period_pr(starttext, endtext, day, ven, disable_scroll){

	var start = 1;
	var end = (23*60 + 59);

	var venue = ven;

	if(ven){
		venue = ven.toUpperCase()
	}

	if(starttext !== ""){
		start = convertToStamp(starttext);
	}
	if(endtext !== ""){
		end = convertToStamp(endtext);
	}

	if(start >= 0 && end >= start && end < (24*60)){
		// valid
	}
	else{
		return print_error("時間格式錯誤 / Time format invalid.");
	}

	var range = day + " " + convertToDisp(starttext) + "-" + convertToDisp(endtext);

	// if(window.jQuery && onServer===true){
	// 	$.post(
	// 		"check_look_func_available.php",
	// 		{content: range},
	// 		checkAvailable
	// 	);
	// }

	finding_period = true;

	studyPlanLink.style.display = "inline-block";
	studyPlanDiv.innerHTML = "<hr class='full'><p>"+studyPlanHeader+"<br><small>區間 Range: " + range + "</small></p>";


	if(disable_scroll && disable_scroll===true){

	}
	else{
		var scrollTopPx = document.getElementById("study-plan").offsetTop;
		window.scrollTo(0,scrollTopPx);
		document.getElementById("courses-list").scrollTop = scrollTopPx;
	}

	var im_courses = [];
	var current_course_code_list = getSelectedCourseCodeList();

	for(var i=0; i<courses_info.length; i++){

		if(current_course_code_list.indexOf(courses_info[i].code)!==-1){
			continue;
		}

		if(!courses_info[i].startStamp){
			courses_info[i].startStamp = convertToStamp(courses_info[i].start);
		}
		if(!courses_info[i].endStamp){
			courses_info[i].endStamp   = convertToStamp(courses_info[i].end);
		}

		var matched = courses_info[i].day === day;

		if(starttext === '') {
			// end only.
			matched = (matched
				&& courses_info[i].endStamp <= end
				&& courses_info[i].endStamp > (end - 60));
		}
		else if(endtext === '') {
			// start only.
			matched = (matched
				&& courses_info[i].startStamp >= start
				&& courses_info[i].startStamp < (start + 60));
		}
		else{ 
			matched = (matched
				&& courses_info[i].startStamp >= start
				&& courses_info[i].endStamp <= end);
		}

		if(venue !== ""){
			matched = matched && (courses_info[i].venue.substr(0,venue.length) === venue);
		}

		if(matched){

			im_courses.push(courses_info[i]);
		}
	}
	
	removeError();

	if(im_courses.length === 0){
		studyPlanDiv.innerHTML += '<p>此期間沒有課堂 / No class in this period.';
	}
	else{
		// studyPlanDiv.innerHTML += '<p>&nbsp;</p>';

		studyPlanDiv.innerHTML += '<p>共有 <span id="course-count">' + (im_courses.length) + '</span> 節課</p>';// +
			// '<p>上堂時間/Classes start at <br><span id="timeslots"></span></p>';

		allSlotItems = [];
		selectedCourseCount = 0;

		var slots_collection = [];

		var div = document.createElement("div");
		// var less_arr = {};
		// var less_arr_2 = {};

		for(var i=0; i<im_courses.length; i++){
			var p = document.createElement("p");
			var stri = '<a href="javascript:add(\'' + im_courses[i].code + '\',null,true)">' +
				'<b>' + im_courses[i].code + '</b><br><small>' + im_courses[i].name + '</small></a><small class="location">@' + im_courses[i].venue + ' by ' + im_courses[i].prof + '</small>';

			var conflict_arr = [];
			var dates = [];
			var dates_GBS_divId = 'cl-';

		// 計上課
			var key = im_courses[i].start;
			var venue = im_courses[i].venue.split("-")[0];

		// 計算該時間段的課堂數量
			// if(!less_arr[key]){
			// 	less_arr[key] = {count: 0};
			// }
			// less_arr[key].count++;

		// 計算該時間段、同一地點的課堂數量
			// if(!less_arr[key][venue]){
			// 	less_arr[key][venue] = 0;
			// }
			// less_arr[key][venue]++;

		// 計落課
			var key = im_courses[i].end;

			// if(!less_arr_2[key]){
			// 	less_arr_2[key] = {count: 0};
			// }
			// less_arr_2[key].count++;

			// if(!less_arr_2[key][venue]){
			// 	less_arr_2[key][venue] = 0;
			// }
			// less_arr_2[key][venue]++;



		var has_more_than_one_prof = false;
		var target_code_substr = im_courses[i].code.substr(0,course_code_length);
		var target_code_prof   = im_courses[i].prof;

		for(var jx in courses_info){

			var ths = courses_info[jx];
			if(ths.code !== im_courses[i].code){

				// if same class, different section
				if(ths.code.substr(0,course_code_length) === target_code_substr
					&& ths.prof !== target_code_prof){
					has_more_than_one_prof = true;
				}
				continue;	// skip to next loop
			}

			dates_GBS_divId += ths.day + ths.start + '-' + ths.end;

			var should_show_checkbox = (ths.start === dates_GBS_divId.substr(6,5));

			if(slots_collection.indexOf(ths.start) === -1 && should_show_checkbox === true) {
				slots_collection.push(ths.start);
				allSlotItems.push(ths.start);
			}
			dates.push(dayDisp[dayName.indexOf(ths.day)] + " - " + ths.start + "-" + ths.end + (ths.type==='Lecture' ? '' : " (" + ths.type + ")"));

			// stri += "<br><small>";
			// stri += dayDisp[dayName.indexOf(ths.day)] + " - " + ths.start + "-" + ths.end + "<br>" + ths.venue + " (" + ths.type + ")";

			for(var ix in courses){

				var oppose = courses[ix];

				if(
					oppose.code !== ths.code
					&& oppose.day === ths.day
					&& conflict_arr.indexOf(oppose.code)===-1
					&& (
						(oppose.startStamp <= ths.startStamp && oppose.endStamp >= ths.startStamp)
						|| (oppose.startStamp <= ths.endStamp && oppose.endStamp >= ths.endStamp)
						|| (oppose.startStamp >= ths.startStamp && oppose.endStamp <= ths.endStamp)
					)
				){

					conflict_arr.push(oppose.code);

					// stri += "<br><span class=\"warning\">與" + oppose.code + "衝突</span>";
				}
				// console.log(oppose.code, ths.code);
			}

			// stri += "</small>";
		}

			// console.log(target_code_substr);

			// var umacinfo_text = '<br><a href="https://rateprof.tk/course/umac-mo/' + target_code_substr + '" target="_blank" class="umacinfo">前往暗黑資料庫查看評分</a>';
			var namecard = target_code_prof.split(" ")[0];
			namecard = namecard[0].toUpperCase() + namecard.substr(1).toLowerCase();

			var umacinfo_params = '?New_code=' + target_code_substr + '&prof_name=' + encodeURIComponent(target_code_prof.split(" \(in ")[0]);
			profBtn++;

			var umacinfo_text = '<a href="https://www.umeh.top/instructor.html' + umacinfo_params + '" target="_blank" class="umacinfo" id="prof-' + profBtn + '"><i class="fa fa-address-card-o" aria-hidden="true"></i> ' + namecard + '</a>';

			// if(window.jQuery){
			// 	$.get(
			// 		"https://umac.info/api/search/course/umac-mo/" + target_code_prof,
			// 		{},
			// 		function(data){
			// 			console.log(data);
			// 		}
			// 	);
			// }

			// var umacinfo_text = '<br><a href="javascript:getRate(\'' + target_code_substr + '\',\'' + target_code_prof.split("(in")[0].cleanup() + '\')" class="umacinfo">查看教授評分</a>';

			if(has_more_than_one_prof === false){
				umacinfo_text = '<br><span class="umacinfo"><i class="fa fa-info-circle" aria-hidden="true"></i> 這科唯一的教授 The only prof of this course</span>'
			}

			// console.log(dates_GBS_divId);

			dates_GBS_divId = dates_GBS_divId.replace(/:/g, '');

			if(!document.getElementById(dates_GBS_divId)) {
				var tmpDiv = document.createElement('div');
				tmpDiv.id = dates_GBS_divId;
				studyPlanDiv.appendChild(tmpDiv);
			}

			var tmpDiv = document.getElementById(dates_GBS_divId);

			if(conflict_arr.length === 0){

				// console.log(dates);

				stri += '<small>' + dates.join("<br>") + "</small>";
				stri += '<br><span class="warning" style="background:#b8e4b8;color:#099848;">未與現有任何科目衝突 No Conflict</span>';

				p.innerHTML = stri + umacinfo_text;
				tmpDiv.appendChild(p);
			}
			else{
				stri = "<del>" + stri + "</del>";
				stri += '<span class="warning">與 ' + conflict_arr.join(', ') + ' 衝突</span>';
				p.innerHTML = stri + umacinfo_text;
				tmpDiv.appendChild(p);
			}

			if(has_more_than_one_prof === true) {
				checkProfBtn(profBtn, umacinfo_params);
			}
		}

		// 上課時間概要列表
		// slots_collection.sort();
		// for (var i=0; i<slots_collection.length; i++) {
		// 	var this_slot = slots_collection[i];
		// 	var slot_a = document.createElement('span');
		// 	slot_a.innerHTML = '<label for="r-'+i+'"><span><input type="checkbox" id="r-'+i+'" checked onchange="filterCourses(\''+this_slot+'\')">' + this_slot + '</span></label>';
		// 	document.getElementById("timeslots").appendChild(slot_a);
		// }

	// 將object變成array
		// var less_arr_fromObj = [];
		// for(var i in less_arr){
		// 	less_arr[i].timeslot = i;
		// 	less_arr_fromObj.push(less_arr[i]);
		// }
		// var less_arr_2_fromObj = [];
		// for(var i in less_arr_2){
		// 	less_arr_2[i].timeslot = i;
		// 	less_arr_2_fromObj.push(less_arr_2[i]);
		// }

	// 結果拼成字串
		// var str_l = "<p>&nbsp;</p><p><b>時間及地點分佈 Distribution</b></p>";

		// str_l += "<small>(上課 Begin at)</small>" + draw_diagram(less_arr_fromObj, "limegreen");
		// str_l += "<br>&nbsp;<br><small>(下課 End at)</small>" + draw_diagram(less_arr_2_fromObj, "salmon");

		// studyPlanDiv.appendChild(div);

		// studyPlanDiv.innerHTML += '<p><span id="splist"></span></p>';
		// document.getElementById("splist").innerHTML = str_l;
	}
}

function filterCourses(changed_slot){
	var allslots = document.querySelectorAll('#study-plan div');
	var slotIndexOf = blackListSlot.indexOf(changed_slot);
	selectedCourseCount = 0;

	// mark the changed checkbox.
	if(slotIndexOf >= 0){
		blackListSlot.splice(slotIndexOf, 1);
	}
	else {
		blackListSlot.push(changed_slot);
	}

	for (var i = 0; i < allslots.length; i++) {
		var this_slot = allslots[i];
		this_slot.style.display = 'block';

		var bye = false;

		for(var j=0; j<blackListSlot.length; j++){
			if(this_slot.id.indexOf(blackListSlot[j].replace(':',''))%12===6) {
				// this is the blacklisted one.

				// console.log(this_slot);
				this_slot.style.display = 'none';
				bye = true;
				break;
			}
		}

		if(bye === false){
			selectedCourseCount += (document.querySelectorAll('#' + this_slot.id + ' p').length);
		}
	}

	document.getElementById('course-count').innerHTML = selectedCourseCount;
}

function find_period(disable_scroll){

	var start = document.getElementById("pr-start").value;
	var end = document.getElementById("pr-end").value;
	var day = document.getElementById("pr-day").value;
	var ven = document.getElementById("pr-ven").value;

	var real_start = "";
	var real_end = "";

	if(start.length === 4){
		start = '0' + start;
	}
	if(/^[0-9]{2}:[0-9]{2}$/.test(start)) {
		real_start = start;
	}
	if(end.length === 4){
		end = '0' + end;
	}
	if(/^[0-9]{2}:[0-9]{2}$/.test(end)) {
		real_end = end;
	}

	if(real_start==="" && real_end===""){
		return print_error("時間格式錯誤 / Time format invalid.");
	}

	localStorage["prdata"] = JSON.stringify({
		start: real_start,
		end: real_end, 
		day: day,
		ven: ven
	});

	find_period_pr(start, end, day, ven, (disable_scroll && disable_scroll===true));

}

function ctrlZ(){

	cur_ver--;

	courses = JSON.parse(versions[cur_ver]);
	genIt(null, true, true);
}

function ctrlY(){

	cur_ver++;

	courses = JSON.parse(versions[cur_ver]);
	genIt(null, true, true);
}

if(localStorage["prdata"]){
	var old_data = JSON.parse(localStorage["prdata"]);

	var start = document.getElementById("pr-start");
	var end = document.getElementById("pr-end");
	var day = document.getElementById("pr-day");
	var ven = document.getElementById("pr-ven");

	start.value = old_data.start;
	end.value = old_data.end;
	day.value = old_data.day;

	if(old_data.ven){
		ven.value = old_data.ven;
	}
}

if(localStorage["prSrchText"]){
	document.getElementById("coursename").value = localStorage["prSrchText"];
}

genIt();
window.setInterval(checkTextOverflow, 124);

// var i=0;
// function checkTextBlink() {
// 	i++;
// 	console.log(i);
// 	if(i >= 2) {
// 		$(".day-col a span.text-blink span").animate({width: "toggle"}, 150);
// 	}
// 	if(i==3) {
// 		i = 0;
// 	}
// }
// window.setInterval(checkTextBlink, 1500);

