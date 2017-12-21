var timetable = document.getElementById("timetable");
var template = timetable.innerHTML;
var finding_period = false;
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

		if(looked_courses.indexOf(tmp_courses[i].code)>-1){
			continue;
		}

		looked_courses.push(tmp_courses[i].code);

		var found = false;

		for(var j=0; j<courses_info.length; j++){
			if(courses_info[j].code === tmp_courses[i].code){
				found = true;
				courses.push(courses_info[j]);
			}
		}

		if(!found){
			error_courses.push(tmp_courses[i].code);
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
	"星期日/Sun",
	"星期一/Mon",
	"星期二/Tue",
	"星期三/Wed",
	"星期四/Thu",
	"星期五/Fri",
	"星期六/Sat"
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

function lockScrollToggle(){
	var body = document.getElementById("body");
	if(body.className === ""){
		body.className = "lockScreen";
	}
	else{
		body.className = "";
	}
}
function changeValue(courseCode){
	document.getElementById("coursename").value = courseCode;
	return true;
}
var urlParam = window.location.search;
if(urlParam.indexOf("course=") > -1){
	var courseCode_param = urlParam.substr(urlParam.indexOf("course=")+7, 7);
	changeValue(courseCode_param);
	add(courseCode_param);
	hasUrlParam = true;
}
function lockToggle(){
	if(localStorage["lockMode"] && localStorage["lockMode"]==="lock"){
		localStorage["lockMode"] = "unlock";
	}
	else{
		localStorage["lockMode"] = "lock";
	}
	genIt(null, null, true);
}
function convertToStamp(t){
	return (parseInt(t.substr(0,2)) * 60) + (parseInt(t.substr(3,2)) * 1);
}
function addToScreen(target, el, i){
	window.setTimeout(function(){
		target.appendChild(el);
	}, i);
}

function genIt(courses_list, no_scroll, is_ctrlZ){

	if(no_scroll && no_scroll===true){
		window.scrollTo(0,0);
		document.getElementById("courses-list").scrollTop = document.getElementById("isw-form").offsetTop;
	}
	else{

		var target = 0;

		if(studyPlanDiv.innerHTML !== ""){
			target = studyPlanDiv.offsetTop;
		}

		window.scrollTo(0,document.getElementById("wrapper").offsetTop);
		document.getElementById("courses-list").scrollTop = target;
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


	if(
		allCourseMode===true ||
		(localStorage["lockMode"] && localStorage["lockMode"]==="lock")
	){
		document.getElementById("overlay").className = "lock";
		document.getElementById("lock").className = "lock";
		localStorage["lockMode"] = "lock";
		// document.getElementById("lock").innerHTML = "按此解鎖 Click to unlock<br><small>解鎖後，您將可以從課程表中刪除科目<br>Unlock to remove course(s) from timetable.</small>";
	}
	else{
		document.getElementById("overlay").className = "unlock";
		document.getElementById("lock").className = "unlock";
		// document.getElementById("lock").innerHTML = "按此鎖定 Click to lock<br><small>鎖定課程表能避免誤刪課程<br>Lock to protect course(s) from removing.</small>";
	}
	earliest = undefined;
	latest = undefined;
	timetable.innerHTML = template;
	document.getElementById("morning").style.height = 0 + "px";
	document.getElementById("night").style.height = 0 + "px";
	document.getElementById("afternoon").style.height = 0 + "px";
	var day = document.querySelectorAll(".col");
	for(var i=0; i<day.length; i++){
		day[i].style.height = totalHeight + 'px';
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

	for(var i=0; i<courses_list.length; i++){

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
	for(var i=0; i<courses_list.length; i++){
		var tmpLineHeight = lineHeight;
		var weekday = dayName.indexOf(courses_list[i].day);
		if(weekday > -1){
			if(allCourseMode === true){
				var basicHTML = "<small>" + courses_list[i].code + "<br><small>" + courses_list[i].start + "-" + courses_list[i].end + " @ " + courses_list[i].venue + "</small></small>";
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
			// if(allCourseMode === false){
				div.href = "javascript:deleteIt('" + courses_list[i].code + "')";
			// }
			// else{
			// 	div.href = "javascript:void(0)";
			// }
			div.style.top = parseInt((courses_list[i].startStamp - earliest) * heightOf1Min) + "px";
			var divHeight = ((courses_list[i].endStamp - courses_list[i].startStamp) * heightOf1Min - 12);
			div.style.height = parseInt(divHeight) + "px";
			var paddingTop = (divHeight - (tmpLineHeight*4)) / 2;
			if(allCourseMode === false){
				var basicHTML = courses_list[i].code + "<br><small><small>" + courses_list[i].name + "</small></small><br><small>" + courses_list[i].venue + "<br>" + courses_list[i].start + "-" + courses_list[i].end + "</small>";
				if(paddingTop > 0){
				 	div.innerHTML = basicHTML;
				}
				else{
					tmpLineHeight = 8;
					var paddingTop = (divHeight - (tmpLineHeight*3)) / 2;
					div.innerHTML = "<small>" + courses_list[i].code + "<br><small>" + courses_list[i].name + "</small><br>" + courses_list[i].start + "-" + courses_list[i].end + ", " + courses_list[i].venue + "</small>";
				}
			}
			else{
				tmpLineHeight = 9;
				var paddingTop = 7;
				div.innerHTML = basicHTML;
				div.id = courses_list[i].code + "-" +courses_list[i].start + "-" +courses_list[i].end + "-" +courses_list[i].day;
			}
			if(paddingTop > 0){
				div.style.paddingTop = parseInt(paddingTop) + "px";
				div.style.height = parseInt(divHeight - paddingTop) + "px";
			}
			else{
				div.style.paddingTop = "0px";
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
				background = "#222222";
				div.style.color = "#FFFFFF";
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
				span.innerHTML = courses_list[i].code;
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
			div.appendChild(bgDiv);
			// div.appendChild(altText);

			addToScreen(day[weekday], div, i);
		}
	}
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

	for(var i=courses_list.length-1; i>=0; i--){
		if(courses_list[i].code !== previousCourse){
			previousCourse = courses_list[i].code;
			var li = document.createElement("li");
			li.innerHTML = '<h3><span style="background:' + used_colors_list[courses_list[i].code] + '"></span>' + courses_list[i].code + "</h3>" +
							"<p>" + courses_list[i].name + "</p>" +
							"<p><u>上課時間及地點 Time & Venue</u></p>" +
							"<ul id='" + courses_list[i].code + "'></ul>" +
							((courses_list[i].prof.replace(/\s/g, "")==="")
								? ""
								: "<p><u>講師 Lecturer</u><br>" + courses_list[i].prof + "</p>") +
							(courses_list[i].host && (courses_list[i].host.replace(/\s/g, "")==="")
								? ""
								: "<p><u>部門 Dept</u><br>" + courses_list[i].host + "</p>") +
							((courses_list[i].remark.replace(/\s/g, "")==="")
								? ""
								: "<p><u>備註 Remark</u><br>" + courses_list[i].remark.replace(/\n/g, "<br>") + "</p>") +
							'<a href="javascript:add(\'' +courses_list[i].code+ '\')" class="add">加入 Add</a><a href="javascript:deleteIt(\'' +courses_list[i].code+ '\')" class="del">刪除 Delete</a>';
			if(allCourseMode===true){
				if(i < courses.length){
					li.className = "inactive";
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

	li_el.innerHTML += "<b>" + dayDisp[dayIndex] + " - " + ths.start + "-" + ths.end + "</b><br>" + ths.venue + " (" + ths.type + ")";

	// console.log(ths.code);

	for(var ix in courses){

		var oppose = courses[ix];

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


	if(finding_period===true){
		return find_period();
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
function look(coursecode, is_error, is_importing){
	var courses_list_tmp = [];
	for(var i=0; i<courses_info.length; i++){
		if(courses_info[i].code.substr(0,7) === coursecode){
			courses_list_tmp.push(courses_info[i]);
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

			if(window.jQuery){
				$.post(
					"check_look_func_available.php",
					{content: coursecode},
					checkAvailable
				);
			}

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
		window.setTimeout(function(){
			document.getElementById("courses-list").scrollTop = 0;
		},300);
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

	document.getElementById("coursename").value = code_raw;

	if(code_raw.length < 8){
		look(code_raw, null, is_importing);
		return;
	}
	var code = code_raw.substr(0,7) + "-" + code_raw.substr(-3);

	if(window.jQuery && is_importing===false){
		$.post(
			"check_add_func_available.php",
			{content: code},
			checkAvailable
		);
	}

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
		if(courses_info[i].code === code){
			courses.push(courses_info[i]);
			count++;
		}
	}
	if(count === 0){
		return look(code_raw.substr(0,7), true, is_importing);
	}
	else{

		if(is_importing===false){
			removeError();
		}
		document.getElementById("coursename").value = "";
		localStorage["lockMode"] = "unlock";
	}
	genIt()
}
function clear_input(){
	document.getElementById("coursename").value = "";
	fetchIt();
	genIt();
}
function deleteIt(courseCode){
	if(window.jQuery){
		$.post(
			"check_drop_func_available.php",
			{content: courseCode},
			checkAvailable
		);
	}
	for(var i=courses.length-1; i>=0; i--){
		if(courses[i].code === courseCode){
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

			var coursecode = courses_info[i].code.substr(0, 7);

			if(added.indexOf(coursecode) === -1
				&& added_last.indexOf(coursecode) === -1
				&& added_other.indexOf(coursecode) === -1){

				var coursename = courses_info[i].name;

				if(match_content_index >= 0){
					coursename = coursename.replace(input_original, "<span>"+input_original+"</span>");
				}
				if(match_prof_index >= 0){
					coursename += "<br><font style='font-weight:normal;text-transform:none'>- Prof: " + courses_info[i].prof.replace(input_original, "<span>"+input_original+"</span>") + '</span>';
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

	var tmp_im_courses = content.match(/[A-Za-z]{4}[0-9]{3}( )?(\([0-9]{3}\))?/g);

	if(window.jQuery){
		$.post(
			"check_isw_func_available.php",
			{content: content},
			checkAvailable
		);
	}

	var im_courses = [];
	var had_repeat = false;

	var is_isw = content.indexOf("Compulsory Major Courses") !== -1;

	if(tmp_im_courses){
		for(var i=0; i<tmp_im_courses.length; i++){

			if(im_courses.indexOf(tmp_im_courses[i]) === -1){
				im_courses.push(tmp_im_courses[i]);
			}
			else{
				had_repeat = true;
			}
		}
	}

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

		var im_courses_detail = content.match(/[A-Za-z]{4}[0-9]{3}[^\n]*/g);

		finding_period = false;

		studyPlanLink.style.display = "block";
		studyPlanDiv.innerHTML = "<hr class='full'><p><b>可選擇的課程列表 Available Courses List</b></p><p>&nbsp;</p>";

		for(var i=im_courses.length-1; i>=0; i--){
			if(im_courses.indexOf(im_courses[i]) < i){
				im_courses.splice(i, 1);
			}
			else if(
				im_courses_detail[i].indexOf(")Completed")!==-1
				|| im_courses_detail[i].indexOf(")In Progress")!==-1
			){
				im_courses.splice(i, 1);
			}
			else{
				var cs_found = false;
				for(var ci=0; ci<courses_info.length; ci++){
					if(courses_info[ci].code.substr(0,7) === im_courses[i]){
						cs_found = true;
						break;
					}
				}

				if(cs_found===false){
					im_courses.splice(i,1);
				}
				else{
					im_courses[i] = {
						code: im_courses[i],
						text: im_courses_detail[i].substr(7)
					};
				}
			}
		}

		for(var i=0; i<im_courses.length; i++){
			var p = document.createElement("p");
			p.innerHTML = '<a href="javascript:add(\'' + im_courses[i].code + '\',null,true)">' +
				'<b>' + im_courses[i].code + '</b><br><small>' + im_courses[i].text + '</small></a>';

			studyPlanDiv.appendChild(p);
		}
		document.getElementById("courses-list").scrollTop = studyPlanDiv.offsetTop;

	}
	else{

		for(var i=0; i<im_courses.length; i++){
			add(im_courses[i].replace(/[\(\)]/g,""), true);
		}
	}
}



var totalSort = {};

function draw_diagram(less_arr_fromObj, color){

	var str_l = "";

	less_arr_fromObj.sort(function(a,b){
		return convertToStamp(a.timeslot) - convertToStamp(b.timeslot);
	})


	for(var i in less_arr_fromObj){
		str_l += "<br><small>" + less_arr_fromObj[i].timeslot + " - " + less_arr_fromObj[i].count + " 節</small>";

	// 把每座大樓都Loop一次
		var count_total = 0;
		var count_total_obj = [];

		var max_percent = 0;
		var max_count = 0;

		for(var j in less_arr_fromObj[i]){
			if(j !== "timeslot" && j !== "count"){
				count_total++;

				var thscount = parseInt(less_arr_fromObj[i][j]);
				var count_wholeBuilding = parseInt(less_arr_fromObj[i].count);

				var percent = (thscount / count_wholeBuilding).toFixed(1);

				count_total_obj.push({
					venue: j,
					perc: percent,
					count: thscount
				});

				if(!totalSort[j]){
					totalSort[j] = 0;
				}
				totalSort[j] += thscount;

				if(thscount > max_count){
					max_percent = percent;
					max_count = thscount;
				}
			}
		}

		str_l += '<div>';

		// 左邊文字佔據 30%.
		var total_width = (100-30);	// in percent

		if(max_count < 10){
			total_width = 30;	// in percent
		}

		// 按課堂數量多少,倒序排列
		count_total_obj.sort(function(a,b){return b.perc - a.perc});

		for(v in count_total_obj){

			console.log(total_width, count_total_obj[v].perc, max_percent, total_width * count_total_obj[v].perc / max_percent);

			var bar_width = parseInt(total_width * count_total_obj[v].perc / max_percent);
			var bar_height = 20;

			if(bar_width < 2){
				bar_width = 2;
			}

			str_l += '<div><div style="width:' + 28 + '%;padding-right:' + 2 + '%;display:inline-block;vertical-align:middle;text-align:right;color:'+color+';font-size:13px;font-weight:bold;">' + count_total_obj[v].venue + ' / ' + count_total_obj[v].count + '</div>'
			 + '<div style="width:' + bar_width + '%;height:' + bar_height + 'px;display:inline-block;margin:3px 0;background:'+color+';vertical-align:middle"></div></div>';
		}

		str_l += '</div>';
	}

	console.log(totalSort);

	return str_l;
}




function find_period_pr(starttext, endtext, day, ven){

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

	var range = day + " " + starttext + "-" + endtext;

	if(window.jQuery){
		$.post(
			"check_look_func_available.php",
			{content: range},
			checkAvailable
		);
	}

	finding_period = true;

	studyPlanLink.style.display = "block";
	studyPlanDiv.innerHTML = "<hr class='full'><p><b>可選擇的課程列表 Available Courses List</b><br><small>區間 Range: " + range + "</small></p>";

	var scrollTopPx = document.getElementById("study-plan").offsetTop;

	window.scrollTo(0,scrollTopPx);
	document.getElementById("courses-list").scrollTop = scrollTopPx;

	var im_courses = [];

	for(var i=0; i<courses_info.length; i++){

		if(!courses_info[i].startStamp){
			courses_info[i].startStamp = convertToStamp(courses_info[i].start);
		}
		if(!courses_info[i].endStamp){
			courses_info[i].endStamp   = convertToStamp(courses_info[i].end);
		}

		var matched = (courses_info[i].startStamp >= start
			&& courses_info[i].endStamp <= end
			&& courses_info[i].day === day);

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

		studyPlanDiv.innerHTML += '<p>共有 ' + (im_courses.length) + ' 節課</p>';

		var div = document.createElement("div");
		var less_arr = {};
		var less_arr_2 = {};

		for(var i=0; i<im_courses.length; i++){
			var p = document.createElement("p");
			var stri = '<a href="javascript:add(\'' + im_courses[i].code + '\',null,true)">' +
				'<b>' + im_courses[i].code + '</b><br><small>' + im_courses[i].name + '</small></a><small class="location">@' + im_courses[i].venue + ' by ' + im_courses[i].prof + '</small>';

			var conflict_arr = [];
			var dates = [];

		// 計上課
			var key = im_courses[i].start;
			var venue = im_courses[i].venue.split("-")[0];

		// 計算該時間段的課堂數量
			if(!less_arr[key]){
				less_arr[key] = {count: 0};
			}
			less_arr[key].count++;

		// 計算該時間段、同一地點的課堂數量
			if(!less_arr[key][venue]){
				less_arr[key][venue] = 0;
			}
			less_arr[key][venue]++;

		// 計落課
			var key = im_courses[i].end;

			if(!less_arr_2[key]){
				less_arr_2[key] = {count: 0};
			}
			less_arr_2[key].count++;

			if(!less_arr_2[key][venue]){
				less_arr_2[key][venue] = 0;
			}
			less_arr_2[key][venue]++;



		var has_more_than_one_section = false;
		var target_code_substr = im_courses[i].code.substr(0,7);

		for(var jx in courses_info){

			var ths = courses_info[jx];

			if(ths.code !== im_courses[i].code){

				// if same class, different section
				if(ths.code.substr(0,7) === target_code_substr){
					has_more_than_one_section = true;
				}
				continue;	// skip to next loop
			}

			dates.push(dayDisp[dayName.indexOf(ths.day)] + " - " + ths.start + "-" + ths.end + " (" + ths.type + ")");

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

			var umacinfo_text = '<a href="https://umac.info/course/' + im_courses[i].code.substr(0,7) + '" target="_blank" class="umacinfo">前往暗黑資料庫查看評分</a>';

			if(has_more_than_one_section === false){
				umacinfo_text = '<br><span class="umacinfo">只有這堂，不用看了</span>'
			}

			if(conflict_arr.length === 0){

				console.log(dates);

				stri += '<small>' + dates.join("<br>") + "</small>";
				stri += '<span class="warning" style="background:#b8e4b8;color:#099848;">未與現有任何科目衝突</span>';

				p.innerHTML = stri + umacinfo_text;
				studyPlanDiv.appendChild(p);
			}
			else{
				stri = "<del>" + stri + "</del>";
				stri += '<span class="warning">與 ' + conflict_arr.join(', ') + ' 衝突</span>';
				p.innerHTML = stri + umacinfo_text;
				div.appendChild(p);
			}

		}


	// 將object變成array
		var less_arr_fromObj = [];
		for(var i in less_arr){
			less_arr[i].timeslot = i;
			less_arr_fromObj.push(less_arr[i]);
		}
		var less_arr_2_fromObj = [];
		for(var i in less_arr_2){
			less_arr_2[i].timeslot = i;
			less_arr_2_fromObj.push(less_arr_2[i]);
		}

	// 結果拼成字串
		var str_l = "<p>&nbsp;</p><p><b>時間及地點分佈 Distribution</b></p>";

		str_l += "<small>(上課 Begin at)</small>" + draw_diagram(less_arr_fromObj, "limegreen");
		str_l += "<br>&nbsp;<br><small>(下課 End at)</small>" + draw_diagram(less_arr_2_fromObj, "salmon");

		studyPlanDiv.appendChild(div);

		studyPlanDiv.innerHTML += '<p><span id="splist"></span></p>';
		document.getElementById("splist").innerHTML = str_l;
	}
}

function find_period(){

	var start = document.getElementById("pr-start").value;
	var end = document.getElementById("pr-end").value;
	var day = document.getElementById("pr-day").value;
	var ven = document.getElementById("pr-ven").value;

	var real_start = "";
	var real_end = "";

	if(start.length === 5){
		real_start = start;
	}
	if(end.length === 5){
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

	find_period_pr(start, end, day, ven);

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

genIt();

