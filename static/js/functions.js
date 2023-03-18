let subsubjectCount = 0;
let lastFocusedElement;
let savedData = JSON.parse(localStorage.getItem('savedData')) || {};

$(document).ready(function() {
    updateSavedSettingsList(savedData);
    loadLastSavedSession();

    // Manage focus state
    manageFocusState();

    // Load settings from local storage on page load
    loadSettings();
	
	// Event listeners
	initializeEventListeners();
	initializeUI();
	addSubsubject("in style of monet","1");
	updateWordCountAndResult();
});



function initializeEventListeners() {
    $("#text-form").submit(processFormData);
	$("#subsubjects").on("click", ".remove-subsubject", function () {removeSubsubject(this);});
    $("#add-subsubject").on("click", function () {addSubsubject();});
    $("#copy").click(copyResultToClipboard);
    $("#saveAs").click(saveToLocalStorage);
    $("#load").click(loadFromLocalStorage);
    $("#delete").click(deleteSelectedData);
    $("#save-json").click(saveSessionsAsJSON);
    $("#open-settings").click(openSettingsPanel);
    $("#close-settings").click(closeSettingsPanel);
    $("#settings-form").submit(saveSettings);
	$("#substyleOptions").click(openSubsubjectsPanel);
	$("#reorderByWeight").click(sortSubsubjectsByWeight);
	$("#delete-all-saved-data").on("click", deleteAllSavedData);
	/*$("body").on("input", ".sub-subject-w", function() {
	  const id = $(this).attr('id');
	  const weightValueId = id.replace('-w', '-value');
	//  $(`#${weightValueId}`).text($(this).val());
	});*/
	$("body").on("input", ".sub-subject-w", function() {
	  updateWeightPercentages();
	});
	


    // Update word count and result on input or keyup
    $("body").on("input keyup", "#subject, #negative, #aspect-ratio, .sub-subject, .sub-subject-w, .disable-sub-subject", updateWordCountAndResult);
}

function processFormData(event) {
    event.preventDefault();

    let formData = {
        subject: $("#subject").val(),
        negative: $("#negative").val(),
        aspect_ratio: $("#aspect-ratio").val(),
        stylize: $("#stylize").val(),
        subsubjects: []
    };

    $(".sub-subject").each(function(index, element) {
        formData.subsubjects.push({
            text: $(element).val(),
            weight: percentageToDecimal($(`#weight-value-${index + 1}`).text()),
            disable: $(`#disable-sub-subject-${index + 1}-w`).val()
        });
    });
    
    const subject = formData.subject;
    const negative = formData.negative;
    const aspect_ratio = formData.aspect_ratio;
    const stylize = formData.stylize;
    const subsubjects = formData.subsubjects;
    const negative_string = formData.negative ? ` --no ${negative}` : "";

    let result = [];
    let word_counts = [];
	let wordCountError = false;

    subsubjects.forEach((subsubject, index) => {

        const checkbox = $(`#disable-sub-subject-${index + 1}`);
		const inputField = 	$(`#sub-subject-${index + 1}`);
        // Get the checked status (true if checked, false if not checked)
        const isChecked = checkbox.is(':checked');
        let text = `${subject}, ${subsubject.text}::${subsubject.weight} `;
		if (isChecked) {
			result.push(text);
        }
		let words = text.match(/\b\w+\b/g).length-1;
		if (words > 60) {
			wordCountError = true;
			inputField.addClass("warning");
		}else{
			inputField.removeClass("warning");

		}
		word_counts.push(words);
    });
	
	
	const errorMessage = 	$(`#error-message`);
	if(wordCountError){
		errorMessage.show();		
	}else{
		errorMessage.hide();		
	}

    if(getSetting("includeImagine")){
		$("#result").val("/imagine prompt: "+result.join('\n')+negative_string+"--stylize "+stylize+" --ar "+aspect_ratio);
	}else{
		$("#result").val(result.join('\n')+negative_string+"--stylize "+stylize+" --ar "+aspect_ratio);
	}
	
	
    $(".word-count").each(function(index, element) {
        $(element).text(`| ${word_counts[index]} words`);
		if($(element).text() == "| undefined words"){
			$(element).text("0 words");
		}
    });
}


function percentageToDecimal(percentage) {
  const numberValue = parseFloat(percentage.replace("%", ""));
  return numberValue / 100;
}

function removeSubsubject(element){
	$(element).parent().remove();
    subsubjectCount--;
    renumberSubsubjectLabels();
    updateWordCountAndResult();
}

function renumberSubsubjectLabels() {
    let subsubjectLabels = $("#subsubjects label[for^='sub-subject-']");

    subsubjectLabels.each(function(index, element) {
        let newIndex = index + 1;
        $(element).attr("for", `sub-subject-${newIndex}`);
        $(element).attr("for", `sub-subject-${newIndex}-w`);
        $(element).text(`${newIndex}:`);
    });
	
    let wordCounts = $("#subsubjects span[class='word-count']");
    wordCounts.each(function(index, element) {
        let newIndex = index + 1;
        $(element).attr("id", `word-count-${newIndex}`);
    });	 
	
    let subsubjectInputs = $("#subsubjects input[name='sub-subject']");
    subsubjectInputs.each(function(index, element) {
        let newIndex = index + 1;
        $(element).attr("id", `sub-subject-${newIndex}`);
    });


    let subsubjectWeightInputs = $("#subsubjects input[name='sub-subject-w']");
    subsubjectWeightInputs.each(function(index, element) {
        let newIndex = index + 1;
        $(element).attr("id", `sub-subject-${newIndex}-w`);
    });
	
	let subsubjectWeightValue = $("#subsubjects span[class='weight-value']");
    subsubjectWeightValue.each(function(index, element) {
        let newIndex = index + 1;
        $(element).attr("id", `weight-value-${newIndex}`);
    });
	
	
}

function copyResultToClipboard(){
    const hiddenElementValue = $("#result").val();
	copyToClipboard(hiddenElementValue);
};

function copyToClipboard(text) {
  // Create a temporary textarea element
  const textarea = $("<textarea></textarea>");
  
  // Set the textarea's value to the text you want to copy
  textarea.val(text);
  
  // Append the textarea to the body (it will not be visible)
  $("body").append(textarea);
  
  // Select the textarea's content
  textarea.select();
  
  // Copy the selected content to the clipboard
  document.execCommand("copy");
  
  // Remove the temporary textarea from the DOM
  textarea.remove();
}


function updateWordCountAndResult() {
    // Trigger the form submit event to update word count and result
    $("#text-form").submit();
}


// Move the subsubject addition code into a separate function
function addSubsubject(text = '', weight = '1') {
    subsubjectCount++;
    $("#subsubjects").append(`
			<div>
				<label for="disable-sub-subject-${subsubjectCount}">Disable:</label>
				<input type="checkbox" name="disable-sub-subject" id="disable-sub-subject-${subsubjectCount}" class="disable-sub-subject" checked=true>
				<label for="sub-subject-${subsubjectCount}">${subsubjectCount}:</label>
				<input type="text" name="sub-subject" id="sub-subject-${subsubjectCount}" class="sub-subject" value="${text}">
				<span id="word-count-${subsubjectCount}" class="word-count"></span>
				<label for="sub-subjectweight-${subsubjectCount}">Weight:</label>
				 <input type="range" name="sub-subject-w" id="sub-subject-${subsubjectCount}-w" class="sub-subject-w" value="${weight}" min="0" max="1" step="0.001">
				<span id="weight-value-${subsubjectCount}" class="weight-value">${weight}</span>

				
				<button type="button" class="remove-subsubject"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
</svg></button>
				<br>
			</div>
		`);
		updateWeightPercentages();

}


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
    $(".sub-subject").each(function(index, element) {
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
        $("#subsubjects").val(formData.subsubjects);
        subsubjectCount = 0;
        formData.subsubjects.forEach(function(subsubject) {
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
        formData.subsubjects.forEach(function(subsubject) {
            addSubsubject(subsubject.text, subsubject.weight);
        });
        updateWordCountAndResult();
    } else {
        alert('No saved data found in local storage for the selected setting.');
    }
}


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


function saveSessionsAsJSON() {
    const savedData = JSON.parse(localStorage.getItem('savedData')) || {};
    const processedSessionsArray = [];

    for (const settingName in savedData) {
        const processedSession = processSessionData(savedData[settingName]);
        processedSessionsArray.push(processedSession);
    }

    const jsonString = JSON.stringify(processedSessionsArray, null, 2);
    const blob = new Blob([jsonString], {
        type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = "processed_sessions.json";
    link.click();

    // Clean up URL object to avoid memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 0);
}



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
function manageFocusState() {
    $(document).on('click focus keyup', 'input', function() {
        lastFocusedElement = this;
    });
}

function openSettingsPanel() {
    $("#settings-panel").addClass("open");
}


function closeSettingsPanel() {
    $("#settings-panel").removeClass("open");
}

function saveSettings(event) {
    event.preventDefault();
	
	const settings = JSON.parse(localStorage.getItem("appSettings")) || {};
    
	settings.includeImagine = $("#include-imagine").prop("checked");
	settings.showResultTextbox = $("#show-result-textbox").prop("checked");
    localStorage.setItem("appSettings", JSON.stringify(settings));
	
    alert("Settings saved to local storage.");
	closeSettingsPanel() ;
	initializeUI();
}

// Load settings from local storage on page load
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem("appSettings"));
   
	if (settings && settings.hasOwnProperty("showResultTextbox")) {
        $("#show-result-textbox").prop("checked", settings.showResultTextbox);
    }
	if (settings && settings.hasOwnProperty("includeImagine")) {
        $("#include-imagine").prop("checked", settings.includeImagine);

    }
}

function getSetting(settingKey) {
    const settings = JSON.parse(localStorage.getItem("appSettings"));

    if (settings && settings.hasOwnProperty(settingKey)) {
        const settingValue = settings[settingKey];

        if (typeof settingValue === "boolean") {
            return settingValue;
        } else {
            return settingValue.toString();
        }
    } else {
        console.error(`Setting "${settingKey}" not found.`);
        return null;
    }
}



function getSubsubjectsFromSavedSettings() {
    let savedData = JSON.parse(localStorage.getItem('savedData')) || {};
    let subsubjects = [];

    for (let settingName in savedData) {
        for (let subsubject of savedData[settingName].subsubjects) {
            subsubjects.push(subsubject);
        }
    }

    return subsubjects;
}


function openSubsubjectsPanel() {
    let subsubjects = getSubsubjectsFromSavedSettings();
    let subsubjectsList = $("#subsubjects-list");
    subsubjectsList.empty();

	const uniqueSubsubjects = new Set();

	subsubjects.forEach((subsubject, index) => {
		if (!uniqueSubsubjects.has(subsubject.text)) {
			uniqueSubsubjects.add(subsubject.text);
			subsubjectsList.append(`
				<div>
					<input type="checkbox" id="sub-subject-option-${index}" class="sub-subject-option" data-text="${subsubject.text}" data-weight="${subsubject.weight}">
					<label for="sub-subject-option-${index}">${subsubject.text}</label>
				</div>
			`);
		}
	});

    $("#subsubjects-panel").addClass("open");

    $("#confirm-subsubjects").off("click").on("click", function() {
        $(".sub-subject-option:checked").each(function() {
            addSubsubject($(this).data("text"), $(this).data("weight"));
        });
        updateWordCountAndResult();
        $("#subsubjects-panel").removeClass("open");
    });

    $("#cancel-subsubjects").off("click").on("click", function() {
        $("#subsubjects-panel").removeClass("open");
    });
}

function deleteAllSavedData() {
    const confirmation = confirm("Are you sure you want to delete all saved session data? This action cannot be undone.");
    
    if (confirmation) {
        localStorage.removeItem('savedData');
        updateSavedSettingsList({});
        alert("All saved session data has been deleted.");
    }
}


function initializeUI(){
	const resultDiv = 	$(`#result-text-box`);
	
	if(getSetting("showResultTextbox")){
		resultDiv.css("display", "block");
	}else{
		resultDiv.css("display", "none");
	}
}

function sortSubsubjectsByWeight() {
  // Get all subsubjects and their weights
  const subsubjects = $(".sub-subject").map(function() {
    return {
      element: $(this),
      weight: parseFloat($(this).siblings(".sub-subject-w").val()) || 0
    };
  }).get();

  // Sort subsubjects by weight in descending order
  subsubjects.sort((a, b) => b.weight - a.weight);

  // Rearrange subsubjects in the DOM
  subsubjects.forEach((subsubject, index) => {
    const parent = subsubject.element.parent();
    parent.detach();
    $("#subsubjects").append(parent);
  });

  // Renumber subsubject labels
  renumberSubsubjectLabels();

  // Update word count and result
  updateWordCountAndResult();
}

function updateWeightPercentages() {
  let totalWeight = 0;
  $(".sub-subject-w").each(function() {
    totalWeight += parseFloat($(this).val());
  });


  $(".sub-subject-w").each(function() {
    const id = $(this).attr("id");
    const weightValueId = id.replace("sub-subject", "weight-value").replace("-w", "");;
	const percentage = (parseFloat($(this).val()) / totalWeight) * 100;
    $(`#${weightValueId}`).text(percentage.toFixed(0) + "%");
  });
}
