function addIdea() {
  //Funzione usata per salvare le informazioni dell'idea aggiunta
  let title = $("#title-idea").val();
  let short_abstract = $("#short-abstract-idea").val();
  let description = $("#description-idea").val();

  let selected = [];
  $('#checkboxes input:checked').each(function() {
    selected.push($(this).attr('name'));
  });

  $.ajax({
    url: api_url + '/api/topics?token=' + Cookies.get('token'),
    type: 'POST',
    dataType: 'json',
    data: {
      'professor_id': Cookies.getJSON('profile').id,
      'title': title,
      'short_abstract': short_abstract,
      'description': description,
      'resource': "", //How to handle resources
      'assigned': false,
      'categories': selected
    },
    success: function() {
      window.location = 'idee.html';
    }
  });
}

function reset() {
  $("#title-idea").val("");
  $("#short-abstract-idea").val("");
  $("#description-idea").val("");

  $('#checkboxes input:checked').each(function() {
    $(this).prop("checked", false);
  });
}

function search() {

}
