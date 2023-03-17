$(document).ready(function () {
    let subsubjectCount = 0;
	let savedData = JSON.parse(localStorage.getItem('savedData')) || {};
    updateSavedSettingsList(savedData);
	loadLastSavedSession();

	
	
	
	function processFormData(data) {
		const subject = data.subject;
		const negative = data.negative;
		const aspect_ratio = data.aspect_ratio;
		const stylize = data.stylize;
		const subsubjects = data.subsubjects;
		const negative_string = negative ? ` --no ${negative}` : "";

		let result = [];
		let word_counts = [];

		subsubjects.forEach((subsubject,index) => {
			
			const checkbox = $(`#disable-sub-subject-${index + 1}`);

			// Get the checked status (true if checked, false if not checked)
			const isChecked = checkbox.is(':checked');
			
			
			console.log(isChecked);
			if(!isChecked){
				let text = `${subject}, ${subsubject.text}::${subsubject.weight} `;
				let words = text.match(/\b\w+\b/g).length;

				if (words <= 60) {
					result.push(text);
					word_counts.push(words);
				}
			}
		});

		return {
			"result": "/imagine prompt: "+result.join("\n") + (negative_string) + " --ar " + aspect_ratio + " --stylize "+stylize,
			"word_counts": word_counts
		};
	}

	$("#text-form").submit(function (event) {
		event.preventDefault();

		let formData = {
			subject: $("#subject").val(),
			negative: $("#negative").val(),
			aspect_ratio: $("#aspect-ratio").val(),
			stylize: $("#stylize").val(),
			subsubjects: []
		};

		$(".sub-subject").each(function (index, element) {
			formData.subsubjects.push({
				text: $(element).val(),
				weight: $(`#sub-subject-${index + 1}-w`).val(),
				disable: $(`#disable-sub-subject-${index + 1}-w`).val()
			});
		});

		const data = processFormData(formData);
		$("#result").val(data.result);
		$(".word-count").each(function (index, element) {
			$(element).text(`${data.word_counts[index]} words`);
		});
		
		//Auto copy to clipboard on change and return focus
		$("#result").select();
        document.execCommand("copy");
			
		if (lastFocusedElement) {
			lastFocusedElement.focus();
		}	
		
	});

	
	
	
	
	
	
	$("#subsubjects").on("click", ".remove-subsubject", function () {
		$(this).parent().remove();
		subsubjectCount--;
		renumberSubsubjectLabels();
		updateWordCountAndResult();
	});
		
	function renumberSubsubjectLabels() {
		let subsubjectLabels = $("#subsubjects label[for^='sub-subject-']");

		subsubjectLabels.each(function (index, element) {
			let newIndex = index+1;
			$(element).attr("for", `sub-subject-${newIndex}`);
			$(element).text(`Sub-style ${newIndex}:`);
		});
	}


    $("#copy").click(function () {
        $("#result").select();
        document.execCommand("copy");
    });
	
	

	
	
	
	function updateWordCountAndResult() {
		// Trigger the form submit event to update word count and result
		$("#text-form").submit();
	}
	
	$("#text-form").on("input", updateWordCountAndResult);

	$("body").on("input", "#subject, #negative, #aspect-ratio, .sub-subject, .sub-subject-w", updateWordCountAndResult);
	$("body").on("keyup", "#subject, #negative, .sub-subject, .sub-subject-w", updateWordCountAndResult);
	
	// Move the subsubject addition code into a separate function
	function addSubsubject(text = '', weight = '') {
		subsubjectCount++;
		$("#subsubjects").append(`
			<div>
				<label for="sub-subject-${subsubjectCount}">Sub-style ${subsubjectCount}:</label>
				<input type="text" name="sub-subject" id="sub-subject-${subsubjectCount}" class="sub-subject" value="${text}">
				<span id="word-count-${subsubjectCount}" class="word-count"></span>
				<label for="sub-subjectweight-${subsubjectCount}">Weight:</label>
				<input type="number" name="sub-subject-w" id="sub-subject-${subsubjectCount}-w" class="sub-subject-w" value="${weight}">
				<label for="disable-sub-subject-${subsubjectCount}">Disable:</label>
				<input type="checkbox" name="disable-sub-subject" id="disable-sub-subject-${subsubjectCount}" class="disable-sub-subject">
				<button type="button" class="remove-subsubject">Remove</button>
				<br>
			</div>
		`);
		
	}

	// Update the click event handler for #add-subsubject
	$("#add-subsubject").click(function () {
		addSubsubject();
	});
	
	function updateSavedSettingsList(savedData) {
		let selectElement = $("#saved-settings");
		selectElement.empty();
		for (let settingName in savedData) {
			selectElement.append(`<option value="${settingName}">${settingName}</option>`);
		}
	}

	// Updated saveToLocalStorage function
	function saveToLocalStorage() {
		let formData = {
			subject: $("#subject").val(),
			negative: $("#negative").val(),
			aspect_ratio: $("#aspect-ratio").val(),
			stylize: $("#stylize").val(),
			subsubjects: []
		};
		$(".sub-subject").each(function (index, element) {
			formData.subsubjects.push({
				text: $(element).val(),
				weight: $(`#sub-subject-${index + 1}-w`).val()
			});
		});

		let savedData = JSON.parse(localStorage.getItem('savedData')) || {};
		let settingName = prompt("Enter a name for this setting:", `${formData.subject}-${subsubjectCount}`);
		if (settingName) {
			savedData[settingName] = formData;
			localStorage.setItem('savedData', JSON.stringify(savedData));
			localStorage.setItem('lastSavedSession', settingName); // Store the name of the last saved session
			alert(`Data saved as "${settingName}" in local storage.`);
			updateSavedSettingsList(savedData);
		} else {
			alert('No name provided. Data not saved.');
		}
	}
	
	// Create a new function to load the last saved session
	function loadLastSavedSession() {
		const savedData = JSON.parse(localStorage.getItem('savedData')) || {};
		const lastSavedSession = localStorage.getItem('lastSavedSession');

		if (lastSavedSession && savedData[lastSavedSession]) {
			const formData = savedData[lastSavedSession];
			$("#subject").val(formData.subject);
			$("#negative").val(formData.negative);
			$("#aspect-ratio").val(formData.aspect_ratio);
			$("#stylize").val(formData.stylize);
			$("#subsubjects").empty();
			subsubjectCount = 0;
			formData.subsubjects.forEach(function (subsubject) {
				addSubsubject(subsubject.text, subsubject.weight);
			});

			
		}
	}	


	// Updated loadFromLocalStorage function
	function loadFromLocalStorage() {
		let savedData = JSON.parse(localStorage.getItem('savedData')) || {};
		let settingName = $("#saved-settings").val();
		if (settingName && savedData[settingName]) {
			let formData = savedData[settingName];
			$("#subject").val(formData.subject);
			$("#negative").val(formData.negative);
			$("#aspect-ratio").val(formData.aspect_ratio);
			$("#stylize").val(formData.stylize);
			$("#subsubjects").empty();
			subsubjectCount = 0;
			formData.subsubjects.forEach(function (subsubject) {
				addSubsubject(subsubject.text, subsubject.weight);
				subsubjectCount++;
			});
			updateWordCountAndResult();
		} else {
			alert('No saved data found in local storage for the selected setting.');
		}
	}
	
	// Add click event handlers for save and load buttons
	$("#saveAs").click(saveToLocalStorage);
	$("#load").click(loadFromLocalStorage);
	
	function deleteSelectedData() {
		let savedData = JSON.parse(localStorage.getItem('savedData')) || {};
		let settingName = $("#saved-settings").val();

		if (settingName && savedData[settingName]) {
			delete savedData[settingName];
			localStorage.setItem('savedData', JSON.stringify(savedData));
			updateSavedSettingsList(savedData);
			alert(`Data for "${settingName}" has been deleted from local storage.`);
		} else {
			alert('No saved data found in local storage for the selected setting.');
		}
	}
	$("#delete").click(deleteSelectedData);
	
	function saveSessionsAsJSON() {
		const savedData = JSON.parse(localStorage.getItem('savedData')) || {};
		const processedSessionsArray = [];

		for (const settingName in savedData) {
			const processedSession = processSessionData(savedData[settingName]);
			processedSessionsArray.push(processedSession);
		}

		const jsonString = JSON.stringify(processedSessionsArray, null, 2);
		const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = "processed_sessions.json";
		link.click();

		// Clean up URL object to avoid memory leaks
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}

	// Bind the 'saveSessionsAsJSON' function to the button click event
	document.getElementById("save-json").addEventListener("click", saveSessionsAsJSON);
	
	
		// Add the processSessionData function
	function processSessionData(sessionData) {
		// Process the session data and return the result
		// You can modify this function to implement your specific processing logic

		const subject = sessionData.subject;
		const negative = sessionData.negative;
		const aspectRatio = sessionData.aspect_ratio;
		const stylize = sessionData.stylize;
		const subsubjects = sessionData.subsubjects;
		let result = "";

		for (const subsubject of subsubjects) {
			result += `${subject}, ${subsubject.text} :: ${subsubject.weight} `;
		}

		if (negative) {
			result += `-no ${negative}`;
		}

		return {
			subject: subject,
			negative: negative,
			aspect_ratio: aspectRatio,
			result: result
		};
	}
	
	//Manage focus stae
	
	let lastFocusedElement;
	
	$(document).on('click', 'input', function () {
		lastFocusedElement = this;
	});
	$(document).on('focus', 'input', function () {
		lastFocusedElement = this;
	});
	$(document).on('keyup', 'input', function () {
		lastFocusedElement = this;
	});
	
	$("body").on("input", ".disable-sub-subject", updateWordCountAndResult);
	
	
});



